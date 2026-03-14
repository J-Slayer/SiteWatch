/**
 * Web reports service — server-side Supabase queries for incident reports.
 * All functions create a fresh server client (cookie-based auth).
 */

import { createClient } from '@/lib/supabase/server';
import type {
  IncidentReport,
  IncidentReportWithRelations,
  IncidentReportUpdate,
  ReportFilters,
  PaginatedResponse,
} from '@sitewatch/types';

const PAGE_SIZE = 20;

export async function getReports(
  companyId: string,
  filters: ReportFilters = {}
): Promise<PaginatedResponse<IncidentReportWithRelations>> {
  const supabase = createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('incident_reports')
    .select(
      `
      *,
      project:projects(id, name, location),
      submitted_by_profile:profiles!incident_reports_submitted_by_fkey(id, full_name, avatar_url, job_title),
      reviewed_by_profile:profiles!incident_reports_reviewed_by_fkey(id, full_name),
      photos:report_photos(id, public_url, thumbnail_path, sort_order, annotations)
      `,
      { count: 'exact' }
    )
    .eq('company_id', companyId)
    .order('occurred_at', { ascending: false })
    .range(from, to);

  if (filters.projectId)    query = query.eq('project_id', filters.projectId);
  if (filters.severity)     query = query.eq('severity', filters.severity);
  if (filters.status)       query = query.eq('status', filters.status);
  if (filters.incidentType) query = query.eq('incident_type', filters.incidentType);
  if (filters.dateFrom)     query = query.gte('occurred_at', filters.dateFrom);
  if (filters.dateTo)       query = query.lte('occurred_at', filters.dateTo);
  if (filters.search) {
    // Simple ilike search across title and description
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count ?? 0;
  return {
    data: (data as unknown as IncidentReportWithRelations[]) ?? [],
    total,
    page,
    pageSize,
    hasMore: from + pageSize < total,
  };
}

export async function getReport(reportId: string): Promise<IncidentReportWithRelations> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('incident_reports')
    .select(
      `
      *,
      project:projects(id, name, location),
      submitted_by_profile:profiles!incident_reports_submitted_by_fkey(id, full_name, avatar_url, job_title),
      reviewed_by_profile:profiles!incident_reports_reviewed_by_fkey(id, full_name),
      photos:report_photos(*)
      `
    )
    .eq('id', reportId)
    .single();

  if (error) throw error;
  return data as unknown as IncidentReportWithRelations;
}

export async function updateReport(
  reportId: string,
  updates: IncidentReportUpdate
): Promise<IncidentReport> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('incident_reports')
    .update(updates)
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data as IncidentReport;
}

/** Analytics: reports grouped by type for the last 30 days */
export async function getReportsByType(companyId: string) {
  const supabase = createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('incident_reports')
    .select('incident_type')
    .eq('company_id', companyId)
    .gte('occurred_at', since);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.incident_type] = (counts[row.incident_type] ?? 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

/** Analytics: report counts broken down by severity for the last 30 days */
export async function getReportsBySeverity(companyId: string) {
  const supabase = createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('incident_reports')
    .select('severity')
    .eq('company_id', companyId)
    .gte('occurred_at', since);

  if (error) throw error;

  const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const row of data ?? []) {
    if (row.severity in counts) counts[row.severity]++;
  }
  return Object.entries(counts).map(([severity, count]) => ({ severity, count }));
}

/** Analytics: daily report counts for the last 30 days */
export async function getDailyTrend(companyId: string) {
  const supabase = createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('incident_reports')
    .select('occurred_at, severity')
    .eq('company_id', companyId)
    .gte('occurred_at', since)
    .order('occurred_at');

  if (error) throw error;

  // Bucket by date
  const buckets: Record<string, { date: string; total: number; critical: number }> = {};
  for (const row of data ?? []) {
    const date = row.occurred_at.slice(0, 10);
    if (!buckets[date]) buckets[date] = { date, total: 0, critical: 0 };
    buckets[date].total++;
    if (row.severity === 'critical') buckets[date].critical++;
  }
  return Object.values(buckets);
}
