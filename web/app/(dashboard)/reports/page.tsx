/**
 * Incident Reports — main list page with server-side filtering and pagination.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getReports } from '@/lib/services/reports.service';
import { getProjects } from '@/lib/services/projects.service';
import { AnimatedReportRow } from '@/components/reports/AnimatedReportRow';
import type { ReportFilters } from '@sitewatch/types';

export const metadata: Metadata = { title: 'Reports' };

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    severity?: string;
    status?: string;
    incidentType?: string;
    projectId?: string;
  };
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user!.id)
    .single();

  const companyId = profile?.company_id;
  if (!companyId) return <NoCompany />;

  const filters: ReportFilters = {
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    pageSize: 20,
    search: searchParams.search || undefined,
    severity: searchParams.severity as any || undefined,
    status: searchParams.status || undefined,
    incidentType: searchParams.incidentType as any || undefined,
    projectId: searchParams.projectId || undefined,
  };

  const [reportsResult, projects] = await Promise.all([
    getReports(companyId, filters),
    getProjects(companyId),
  ]);

  const { data: reports, total, page, pageSize } = reportsResult;
  const totalPages = Math.ceil(total / pageSize);
  const hasFilters = Object.values(searchParams).some(Boolean);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Incident Reports
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {total} report{total !== 1 ? 's' : ''} total
          </p>
        </div>
        {hasFilters && (
          <a
            href="/reports"
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
          >
            Clear filters
          </a>
        )}
      </div>

      {/* Filter bar */}
      <FilterBar
        searchParams={searchParams}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        {reports.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Report', 'Type', 'Site', 'Severity', 'Status', 'Date', ''].map((h, i) => (
                  <th
                    key={i}
                    className={`text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide ${
                      i === 1 ? 'hidden md:table-cell' :
                      i === 2 ? 'hidden lg:table-cell' :
                      i === 5 ? 'hidden sm:table-cell' : ''
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map((report, i) => (
                <AnimatedReportRow key={report.id} report={report} index={i} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} searchParams={searchParams} />
      )}
    </div>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────

function FilterBar({
  searchParams,
  projects,
}: {
  searchParams: PageProps['searchParams'];
  projects: { id: string; name: string }[];
}) {
  const inputCls = "rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all";

  return (
    <form method="GET" action="/reports" className="flex flex-wrap gap-3">
      <input
        name="search"
        defaultValue={searchParams.search}
        placeholder="Search reports…"
        className={`flex-1 min-w-48 ${inputCls} pl-4`}
      />
      <select name="severity" defaultValue={searchParams.severity ?? ''} className={inputCls}>
        <option value="">All Severities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select name="status" defaultValue={searchParams.status ?? ''} className={inputCls}>
        <option value="">All Statuses</option>
        <option value="submitted">Submitted</option>
        <option value="under_review">Under Review</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
        <option value="draft">Draft</option>
      </select>
      <select name="incidentType" defaultValue={searchParams.incidentType ?? ''} className={inputCls}>
        <option value="">All Types</option>
        <option value="near_miss">Near Miss</option>
        <option value="injury">Injury</option>
        <option value="property_damage">Property Damage</option>
        <option value="environmental">Environmental</option>
        <option value="security">Security</option>
        <option value="fire">Fire</option>
        <option value="other">Other</option>
      </select>
      {projects.length > 0 && (
        <select name="projectId" defaultValue={searchParams.projectId ?? ''} className={inputCls}>
          <option value="">All Sites</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}
      <button
        type="submit"
        className="px-5 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
      >
        Filter
      </button>
    </form>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: PageProps['searchParams'];
}) {
  function pageUrl(p: number) {
    const params = new URLSearchParams({ ...searchParams, page: String(p) } as Record<string, string>);
    return `/reports?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between text-sm text-gray-500">
      <p>Page <span className="font-semibold text-gray-700">{page}</span> of {totalPages}</p>
      <div className="flex gap-2">
        {page > 1 && (
          <a href={pageUrl(page - 1)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium">
            ← Prev
          </a>
        )}
        {page < totalPages && (
          <a href={pageUrl(page + 1)} className="px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
            Next →
          </a>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-50 text-3xl mb-3">📋</div>
      <p className="font-semibold text-gray-500" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        {hasFilters ? 'No reports match your filters' : 'No reports yet'}
      </p>
      <p className="text-sm text-gray-400 mt-1">
        {hasFilters ? 'Try adjusting or clearing your filters.' : 'Reports submitted by your field team will appear here.'}
      </p>
      {hasFilters && (
        <a href="/reports" className="inline-block mt-3 text-sm font-medium text-amber-600 hover:text-amber-700">
          Clear filters
        </a>
      )}
    </div>
  );
}

function NoCompany() {
  return (
    <div className="p-8">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-lg">
        <h2 className="font-semibold text-yellow-800 mb-1">No company linked</h2>
        <p className="text-yellow-700 text-sm">Your account is not associated with a company. Contact your administrator.</p>
      </div>
    </div>
  );
}
