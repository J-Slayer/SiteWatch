/**
 * Analytics overview page — the dashboard home.
 * Fetches summary stats server-side; charts rendered client-side in Phase 4.
 */

import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export const metadata = { title: 'Overview' };

async function getStats(companyId: string) {
  const supabase = createClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalReports, openReports, criticalReports, weeklyReports, projects] =
    await Promise.all([
      supabase
        .from('incident_reports')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId),
      supabase
        .from('incident_reports')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .in('status', ['submitted', 'under_review']),
      supabase
        .from('incident_reports')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('severity', 'critical')
        .in('status', ['submitted', 'under_review']),
      supabase
        .from('incident_reports')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', weekAgo),
      supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active'),
    ]);

  return {
    total: totalReports.count ?? 0,
    open: openReports.count ?? 0,
    critical: criticalReports.count ?? 0,
    thisWeek: weeklyReports.count ?? 0,
    activeProjects: projects.count ?? 0,
  };
}

async function getRecentReports(companyId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('incident_reports')
    .select('id, title, severity, status, occurred_at, incident_type')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(5);
  return data ?? [];
}

export default async function OverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the user's company_id from their profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, full_name, role')
    .eq('id', user!.id)
    .single();

  const companyId = profile?.company_id;

  if (!companyId) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-lg">
          <h2 className="font-semibold text-yellow-800 mb-2">No company linked</h2>
          <p className="text-yellow-700 text-sm">
            Your account is not associated with a company yet. Please contact your
            administrator or complete company setup.
          </p>
        </div>
      </div>
    );
  }

  const [stats, recentReports] = await Promise.all([
    getStats(companyId),
    getRecentReports(companyId),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good morning, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here&apos;s what&apos;s happening on your sites.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Reports"
          value={stats.total}
          icon="📋"
          className="col-span-1"
        />
        <StatCard label="Open" value={stats.open} icon="🔵" />
        <StatCard
          label="Critical"
          value={stats.critical}
          icon="🔴"
          highlight={stats.critical > 0}
        />
        <StatCard label="This Week" value={stats.thisWeek} icon="📅" />
        <StatCard label="Active Sites" value={stats.activeProjects} icon="🏗️" />
      </div>

      {/* Recent reports */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
          <Link
            href="/reports"
            className="text-sm text-primary-600 hover:underline font-medium"
          >
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {recentReports.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">No reports yet.</p>
            </div>
          ) : (
            recentReports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600">
                    {report.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(report.occurred_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <SeverityPill severity={report.severity} />
                  <StatusPill status={report.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Charts placeholder for Phase 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartPlaceholder title="Reports by Type" />
        <ChartPlaceholder title="Severity Trend (Last 30 Days)" />
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  highlight = false,
  className = '',
}: {
  label: string;
  value: number;
  icon: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border ${
        highlight ? 'border-red-300 bg-red-50' : 'border-gray-200'
      } p-5 ${className}`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <p className={`text-2xl font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

const SEVERITY_STYLES: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

function SeverityPill({ severity }: { severity: string }) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
        SEVERITY_STYLES[severity] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {severity}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  draft: 'bg-gray-100 text-gray-500',
};

function StatusPill({ status }: { status: string }) {
  const label = status.replace('_', ' ');
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
        STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {label}
    </span>
  );
}

function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <p className="text-xs text-gray-400">Chart coming in Phase 4</p>
      </div>
    </div>
  );
}
