/**
 * Offline service — queues incident reports in SQLite when the device is offline,
 * then syncs them to Supabase when connectivity is restored.
 *
 * Queue schema (local SQLite table "offline_queue"):
 *   id          INTEGER PRIMARY KEY AUTOINCREMENT
 *   client_id   TEXT UNIQUE          -- device UUID, used for server-side dedup
 *   payload     TEXT                 -- JSON-serialised IncidentReportInsert
 *   photo_uris  TEXT                 -- JSON array of local file URIs
 *   created_at  TEXT
 *   sync_status TEXT                 -- 'pending' | 'syncing' | 'synced' | 'failed'
 *   error_msg   TEXT
 *   attempts    INTEGER DEFAULT 0
 */

import * as SQLite from 'expo-sqlite';
import * as Network from 'expo-network';
import type { IncidentReportInsert } from '@sitewatch/types';
import { reportService } from './report.service';
import { photoService } from './photo.service';
import { ImagePickerAsset } from 'expo-image-picker';

const DB_NAME = 'sitewatch_offline.db';

interface QueueRow {
  id: number;
  client_id: string;
  payload: string;
  photo_uris: string;
  created_at: string;
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
  error_msg: string | null;
  attempts: number;
}

export interface OfflineQueueItem {
  id: number;
  clientId: string;
  payload: IncidentReportInsert;
  photoUris: string[];
  createdAt: string;
  syncStatus: QueueRow['sync_status'];
  errorMsg: string | null;
  attempts: number;
}

class OfflineService {
  private db: SQLite.SQLiteDatabase | null = null;

  /** Initialise the SQLite database and create the queue table if needed. */
  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_queue (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id   TEXT UNIQUE NOT NULL,
        payload     TEXT NOT NULL,
        photo_uris  TEXT NOT NULL DEFAULT '[]',
        created_at  TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        error_msg   TEXT,
        attempts    INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) await this.init();
    return this.db!;
  }

  /** Add a report to the offline queue. */
  async enqueue(
    clientId: string,
    payload: IncidentReportInsert,
    photoUris: string[] = []
  ): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT OR IGNORE INTO offline_queue (client_id, payload, photo_uris, created_at)
       VALUES (?, ?, ?, ?)`,
      clientId,
      JSON.stringify(payload),
      JSON.stringify(photoUris),
      new Date().toISOString()
    );
  }

  /** Return all pending items in the queue. */
  async getPendingItems(): Promise<OfflineQueueItem[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<QueueRow>(
      `SELECT * FROM offline_queue WHERE sync_status IN ('pending', 'failed') AND attempts < 5
       ORDER BY created_at ASC`
    );
    return rows.map(this.mapRow);
  }

  /** Return the count of items not yet synced. */
  async getPendingCount(): Promise<number> {
    const db = await this.getDb();
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM offline_queue WHERE sync_status NOT IN ('synced')`
    );
    return row?.count ?? 0;
  }

  /** Attempt to sync all pending items to Supabase. */
  async syncAll(companyId: string): Promise<{ synced: number; failed: number }> {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected || networkState.isInternetReachable === false) {
      return { synced: 0, failed: 0 };
    }

    const items = await this.getPendingItems();
    let synced = 0;
    let failed = 0;

    for (const item of items) {
      try {
        await this.syncItem(item, companyId);
        synced++;
      } catch {
        failed++;
      }
    }

    return { synced, failed };
  }

  private async syncItem(item: OfflineQueueItem, companyId: string): Promise<void> {
    const db = await this.getDb();

    // Mark as syncing
    await db.runAsync(
      `UPDATE offline_queue SET sync_status = 'syncing', attempts = attempts + 1 WHERE id = ?`,
      item.id
    );

    try {
      // Create the report on the server
      const report = await reportService.createReport(item.payload);

      // Upload any photos that were captured offline
      if (item.photoUris.length > 0) {
        for (let i = 0; i < item.photoUris.length; i++) {
          try {
            // Build a minimal asset object from the local URI
            const asset = { uri: item.photoUris[i], mimeType: 'image/jpeg' } as ImagePickerAsset;
            await photoService.uploadPhoto(asset, report.id, companyId, i);
          } catch {
            // Photo upload failures are non-fatal — report is still created
          }
        }
      }

      // Mark as synced
      await db.runAsync(
        `UPDATE offline_queue SET sync_status = 'synced' WHERE id = ?`,
        item.id
      );
    } catch (err: any) {
      await db.runAsync(
        `UPDATE offline_queue SET sync_status = 'failed', error_msg = ? WHERE id = ?`,
        err?.message ?? 'Unknown error',
        item.id
      );
      throw err;
    }
  }

  /** Remove all synced items to keep the queue tidy. */
  async prunesynced(): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(`DELETE FROM offline_queue WHERE sync_status = 'synced'`);
  }

  private mapRow(row: QueueRow): OfflineQueueItem {
    return {
      id: row.id,
      clientId: row.client_id,
      payload: JSON.parse(row.payload) as IncidentReportInsert,
      photoUris: JSON.parse(row.photo_uris) as string[],
      createdAt: row.created_at,
      syncStatus: row.sync_status,
      errorMsg: row.error_msg,
      attempts: row.attempts,
    };
  }
}

// Export a singleton
export const offlineService = new OfflineService();
