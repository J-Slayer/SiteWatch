/**
 * Background sync task — drains the offline SQLite queue while the app
 * is backgrounded or the device is idle.
 *
 * Uses expo-task-manager to define the task and expo-background-fetch
 * to schedule periodic execution (minimum ~15 minutes on iOS due to OS limits).
 *
 * Registration flow:
 *   1. registerBackgroundSync() called once from the app layout on mount.
 *   2. OS wakes the app in the background periodically.
 *   3. BACKGROUND_SYNC_TASK runs: checks connectivity + drains the queue.
 *   4. If synced items exist, a local notification is shown as confirmation.
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Network from 'expo-network';
import { offlineService } from '@/services/offline.service';
import { notificationService } from '@/services/notification.service';
import { supabase } from '@/services/supabase';

export const BACKGROUND_SYNC_TASK = 'SITEWATCH_BACKGROUND_SYNC';

// ── Task definition ────────────────────────────────────────────────────────────
// Must be defined at module level (outside components) per expo-task-manager rules.

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // Check connectivity before attempting sync
    const network = await Network.getNetworkStateAsync();
    if (!network.isConnected || network.isInternetReachable === false) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // We need the company_id to associate photo uploads correctly.
    // Read it from the active Supabase session (persisted in SecureStore).
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return BackgroundFetch.BackgroundFetchResult.NoData;

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) return BackgroundFetch.BackgroundFetchResult.NoData;

    // Drain the queue
    const { synced, failed } = await offlineService.syncAll(profile.company_id);

    // Prune successfully synced rows to keep the DB tidy
    if (synced > 0) {
      await offlineService.prunesynced();

      // Notify the user that their queued reports are now live
      await notificationService.showLocal({
        title: 'Reports Synced',
        body: `${synced} offline report${synced > 1 ? 's' : ''} submitted successfully.`,
        data: { type: 'sync_complete', synced },
      });
    }

    return synced > 0 || failed > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    console.error('[backgroundSync] Task error:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ── Registration helpers ───────────────────────────────────────────────────────

/**
 * Register the background sync task with the OS.
 * Safe to call multiple times — checks if already registered first.
 */
export async function registerBackgroundSync(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (isRegistered) return;

    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (iOS enforces its own minimum)
      stopOnTerminate: false,   // continue after app is killed
      startOnBoot: true,        // resume after device restart
    });

    console.log('[backgroundSync] Task registered.');
  } catch (err) {
    // Background fetch may not be available in Expo Go — fail silently
    console.warn('[backgroundSync] Could not register task:', err);
  }
}

/**
 * Unregister the background task (e.g. on sign-out).
 */
export async function unregisterBackgroundSync(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      console.log('[backgroundSync] Task unregistered.');
    }
  } catch (err) {
    console.warn('[backgroundSync] Could not unregister task:', err);
  }
}
