/**
 * useReports — React Query hooks for incident report data.
 * All network/cache logic lives here; screens just call these hooks.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import { offlineService } from '@/services/offline.service';
import { useConnectivity } from './useConnectivity';
import { useAuthStore } from '@/store/auth.store';
import type {
  ReportFilters,
  IncidentReportInsert,
  IncidentReportUpdate,
} from '@sitewatch/types';
import 'react-native-get-random-values'; // polyfill for crypto.getRandomValues

// ── Query Keys ────────────────────────────────────────────────────────────────
export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (filters: ReportFilters) => [...reportKeys.lists(), filters] as const,
  mine: () => [...reportKeys.all, 'mine'] as const,
  detail: (id: string) => [...reportKeys.all, 'detail', id] as const,
};

// ── useMyReports ──────────────────────────────────────────────────────────────
/** Returns reports submitted by the current user. */
export function useMyReports() {
  return useQuery({
    queryKey: reportKeys.mine(),
    queryFn: () => reportService.getMyReports(),
    staleTime: 1000 * 60 * 2,  // 2 minutes
  });
}

// ── useReports ────────────────────────────────────────────────────────────────
/** Returns a filtered, paginated list of company-wide reports (admin/supervisor). */
export function useReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportKeys.list(filters),
    queryFn: () => reportService.listReports(filters),
    staleTime: 1000 * 60 * 2,
  });
}

// ── useReport ─────────────────────────────────────────────────────────────────
/** Returns a single report with all relations. */
export function useReport(reportId: string) {
  return useQuery({
    queryKey: reportKeys.detail(reportId),
    queryFn: () => reportService.getReport(reportId),
    enabled: !!reportId,
    staleTime: 1000 * 60 * 5,
  });
}

// ── useSubmitReport ───────────────────────────────────────────────────────────
/**
 * Mutation that handles both online and offline report submission.
 *
 * Online  → submits directly to Supabase.
 * Offline → saves to the local SQLite queue for later sync.
 */
export function useSubmitReport() {
  const queryClient = useQueryClient();
  const { isOnline } = useConnectivity();
  const profile = useAuthStore((s) => s.profile);

  return useMutation({
    mutationFn: async ({
      payload,
      photoUris = [],
    }: {
      payload: IncidentReportInsert;
      photoUris?: string[];
    }) => {
      if (isOnline) {
        return reportService.createReport(payload);
      } else {
        // Queue for later sync
        await offlineService.enqueue(
          payload.client_id as string,
          payload,
          photoUris
        );
        return null; // offline; no immediate result
      }
    },
    onSuccess: () => {
      // Invalidate so the reports list refetches
      queryClient.invalidateQueries({ queryKey: reportKeys.mine() });
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

// ── useUpdateReport ───────────────────────────────────────────────────────────
export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, updates }: { reportId: string; updates: IncidentReportUpdate }) =>
      reportService.updateReport(reportId, updates),
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: reportKeys.mine() });
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

// ── useOfflineSync ────────────────────────────────────────────────────────────
/** Returns the pending offline queue count so the UI can show an indicator. */
export function useOfflineQueueCount() {
  return useQuery({
    queryKey: ['offlineQueue', 'count'],
    queryFn: () => offlineService.getPendingCount(),
    refetchInterval: 10_000, // refresh every 10s
  });
}
