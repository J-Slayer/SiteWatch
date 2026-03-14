'use client';

/**
 * AnimatedReportRow — wraps a report table row with a staggered fade-in
 * entrance and a coloured left-border severity indicator on hover.
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { SeverityBadge, StatusBadge } from '@/components/ui/badges';
import { formatDate, snakeToTitle } from '@/lib/utils';
import type { IncidentReportWithRelations } from '@sitewatch/types';

const SEVERITY_BORDER: Record<string, string> = {
  low:      'hover:border-l-green-500',
  medium:   'hover:border-l-yellow-500',
  high:     'hover:border-l-orange-500',
  critical: 'hover:border-l-red-500',
};

interface Props {
  report: IncidentReportWithRelations;
  index: number;
}

export function AnimatedReportRow({ report, index }: Props) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className={`border-l-4 border-l-transparent transition-all group hover:bg-gray-50 ${
        SEVERITY_BORDER[report.severity] ?? 'hover:border-l-gray-300'
      }`}
    >
      <td className="px-5 py-4 max-w-xs">
        <p className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
          {report.title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {report.submitted_by_profile?.full_name ?? '—'}
        </p>
      </td>
      <td className="px-4 py-4 hidden md:table-cell text-gray-600 capitalize">
        {snakeToTitle(report.incident_type)}
      </td>
      <td className="px-4 py-4 hidden lg:table-cell text-gray-600">
        {report.project?.name ?? '—'}
      </td>
      <td className="px-4 py-4">
        <SeverityBadge severity={report.severity} />
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={report.status} />
      </td>
      <td className="px-4 py-4 text-gray-500 text-xs hidden sm:table-cell whitespace-nowrap">
        {formatDate(report.occurred_at)}
      </td>
      <td className="px-4 py-4">
        <Link
          href={`/reports/${report.id}`}
          className="text-primary-600 hover:text-primary-700 font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View →
        </Link>
      </td>
    </motion.tr>
  );
}
