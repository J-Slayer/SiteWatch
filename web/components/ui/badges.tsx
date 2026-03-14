/**
 * Severity and status badge components for use across the admin dashboard.
 */

import { cn, snakeToTitle } from '@/lib/utils';
import type { IncidentSeverity, ReportStatus } from '@sitewatch/types';

// ── Severity Badge ────────────────────────────────────────────────────────────

const SEVERITY_CLASS: Record<IncidentSeverity, string> = {
  low: 'bg-green-100 text-green-700 ring-green-200',
  medium: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  high: 'bg-orange-100 text-orange-700 ring-orange-200',
  critical: 'bg-red-100 text-red-700 ring-red-200',
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset',
        SEVERITY_CLASS[severity as IncidentSeverity] ?? 'bg-gray-100 text-gray-600 ring-gray-200'
      )}
    >
      {severity}
    </span>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

const STATUS_CLASS: Record<ReportStatus, string> = {
  draft: 'bg-gray-100 text-gray-500 ring-gray-200',
  submitted: 'bg-blue-100 text-blue-700 ring-blue-200',
  under_review: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  resolved: 'bg-green-100 text-green-700 ring-green-200',
  closed: 'bg-gray-100 text-gray-600 ring-gray-200',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset',
        STATUS_CLASS[status as ReportStatus] ?? 'bg-gray-100 text-gray-600 ring-gray-200'
      )}
    >
      {snakeToTitle(status)}
    </span>
  );
}

// ── Role Badge ────────────────────────────────────────────────────────────────

const ROLE_CLASS: Record<string, string> = {
  worker: 'bg-gray-100 text-gray-600',
  supervisor: 'bg-blue-100 text-blue-700',
  company_admin: 'bg-purple-100 text-purple-700',
  super_admin: 'bg-red-100 text-red-700',
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        ROLE_CLASS[role] ?? 'bg-gray-100 text-gray-600'
      )}
    >
      {snakeToTitle(role)}
    </span>
  );
}
