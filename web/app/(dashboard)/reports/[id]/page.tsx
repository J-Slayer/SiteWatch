/**
 * Report detail page — full incident report view with status management.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getReport } from '@/lib/services/reports.service';
import { SeverityBadge, StatusBadge } from '@/components/ui/badges';
import { formatDateTime, formatDate, snakeToTitle } from '@/lib/utils';
import { ReportStatusActions } from '@/components/reports/ReportStatusActions';

export const metadata: Metadata = { title: 'Report Details' };

interface PageProps {
  params: { id: string };
}

export default async function ReportDetailPage({ params }: PageProps) {
  let report;
  try {
    report = await getReport(params.id);
  } catch {
    notFound();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link href="/reports" className="hover:text-gray-700">
          Reports
        </Link>{' '}
        /{' '}
        <span className="text-gray-900 font-medium">{report.title}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <SeverityBadge severity={report.severity} />
              <StatusBadge status={report.status} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Reported by{' '}
              <span className="font-medium text-gray-700">
                {report.submitted_by_profile?.full_name ?? '—'}
              </span>{' '}
              · {formatDate(report.occurred_at)}
            </p>
          </div>

          {/* Status actions (client component) */}
          <ReportStatusActions reportId={report.id} currentStatus={report.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <Section title="Description">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {report.description}
            </p>
          </Section>

          {/* Resolution notes */}
          {report.resolution_notes && (
            <Section title="Resolution Notes">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {report.resolution_notes}
              </p>
              {report.reviewed_by_profile && (
                <p className="text-xs text-gray-500 mt-3 italic">
                  — Reviewed by {report.reviewed_by_profile.full_name}
                  {report.reviewed_at && ` on ${formatDate(report.reviewed_at)}`}
                </p>
              )}
            </Section>
          )}

          {/* Photos */}
          {report.photos && report.photos.length > 0 && (
            <Section title={`Photos (${report.photos.length})`}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {report.photos
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((photo) => (
                    <div key={photo.id} className="group relative">
                      {photo.public_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.public_url}
                          alt={photo.caption ?? 'Incident photo'}
                          className="w-full h-40 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <span className="text-3xl">📷</span>
                        </div>
                      )}
                      {photo.caption && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {photo.caption}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </Section>
          )}
        </div>

        {/* Sidebar: metadata */}
        <div className="space-y-5">
          <Section title="Details">
            <dl className="space-y-3 text-sm">
              <MetaItem label="Incident Type" value={snakeToTitle(report.incident_type)} />
              <MetaItem label="Site" value={report.project?.name ?? '—'} />
              {report.project?.location && (
                <MetaItem label="Site Location" value={report.project.location} />
              )}
              {report.location_description && (
                <MetaItem label="Location on Site" value={report.location_description} />
              )}
              <MetaItem label="Occurred" value={formatDateTime(report.occurred_at)} />
              <MetaItem label="Reported" value={formatDateTime(report.reported_at)} />
              {report.injured_person && (
                <MetaItem label="Injured Person" value={report.injured_person} />
              )}
              {report.witnesses && report.witnesses.length > 0 && (
                <MetaItem
                  label="Witnesses"
                  value={report.witnesses.join(', ')}
                />
              )}
            </dl>
          </Section>

          {/* PDF export */}
          <a
            href={`/api/reports/${report.id}/export`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            📄 Export as PDF
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-900 font-medium text-right">{value}</dd>
    </div>
  );
}
