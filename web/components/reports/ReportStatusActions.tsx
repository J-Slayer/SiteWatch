'use client';

/**
 * ReportStatusActions — client component that lets supervisors/admins
 * update the status of an incident report.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { ReportStatus } from '@sitewatch/types';

const NEXT_STATUSES: Partial<Record<ReportStatus, { value: ReportStatus; label: string }[]>> = {
  submitted: [
    { value: 'under_review', label: 'Mark Under Review' },
    { value: 'closed', label: 'Close Report' },
  ],
  under_review: [
    { value: 'resolved', label: 'Mark Resolved' },
    { value: 'closed', label: 'Close Report' },
  ],
  resolved: [{ value: 'closed', label: 'Close Report' }],
};

interface Props {
  reportId: string;
  currentStatus: string;
}

export function ReportStatusActions({ reportId, currentStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [pendingStatus, setPendingStatus] = useState<ReportStatus | null>(null);

  const actions = NEXT_STATUSES[currentStatus as ReportStatus] ?? [];

  if (actions.length === 0) return null;

  async function handleStatusChange(newStatus: ReportStatus) {
    setError(null);
    const supabase = createClient();

    const updates: Record<string, unknown> = {
      status: newStatus,
      reviewed_at: new Date().toISOString(),
    };

    if (newStatus === 'resolved' && resolutionNotes.trim()) {
      updates.resolution_notes = resolutionNotes.trim();
    }

    const { error: updateError } = await supabase
      .from('incident_reports')
      .update(updates)
      .eq('id', reportId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPendingStatus(null);
    setResolutionNotes('');

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 min-w-48">
      {pendingStatus ? (
        <div className="space-y-3">
          {pendingStatus === 'resolved' && (
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Resolution notes (optional)…"
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange(pendingStatus)}
              disabled={isPending}
              className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Updating…' : 'Confirm'}
            </button>
            <button
              onClick={() => setPendingStatus(null)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {actions.map((action) => (
            <button
              key={action.value}
              onClick={() => setPendingStatus(action.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
