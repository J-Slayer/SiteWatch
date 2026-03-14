/**
 * Report service — CRUD operations for incident reports.
 * Used by React Query hooks; never called directly from components.
 */

import { supabase } from './supabase';
import type {
  IncidentReport,
  IncidentReportWithRelations,
  IncidentReportInsert,
  IncidentReportUpdate,
  ReportFilters,
  PaginatedResponse,
} from '@sitewatch/types';
import { Config } from '@/constants/config';

export const reportService = {
  /**
   * Fetch a paginated, filtered list of reports for the current user's company.
   */
  async listReports(filters: ReportFilters = {}): Promise<PaginatedResponse<IncidentReportWithRelations>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? Config.pagination.defaultPageSize;
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
        photos:report_photos(*)
        `,
        { count: 'exact' }
      )
      .order('occurred_at', { ascending: false })
      .range(from, to);

    if (filters.projectId)    query = query.eq('project_id', filters.projectId);
    if (filters.severity)     query = query.eq('severity', filters.severity);
    if (filters.status)       query = query.eq('status', filters.status);
    if (filters.incidentType) query = query.eq('incident_type', filters.incidentType);
    if (filters.dateFrom)     query = query.gte('occurred_at', filters.dateFrom);
    if (filters.dateTo)       query = query.lte('occurred_at', filters.dateTo);
    if (filters.search) {
      query = query.textSearch(
        'fts',
        filters.search,
        { type: 'websearch', config: 'english' }
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
  },

  /**
   * Fetch a single report with all relations.
   */
  async getReport(reportId: string): Promise<IncidentReportWithRelations> {
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
  },

  /**
   * Submit a new incident report.
   * If the user is offline, the caller is responsible for queuing this.
   */
  async createReport(
    payload: IncidentReportInsert
  ): Promise<IncidentReport> {
    const { data, error } = await supabase
      .from('incident_reports')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as IncidentReport;
  },

  /**
   * Update a report's status or fields (supervisors/admins only for status).
   */
  async updateReport(
    reportId: string,
    updates: IncidentReportUpdate
  ): Promise<IncidentReport> {
    const { data, error } = await supabase
      .from('incident_reports')
      .update(updates)
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data as IncidentReport;
  },

  /**
   * Fetch reports submitted by the current authenticated user.
   */
  async getMyReports(): Promise<IncidentReportWithRelations[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('incident_reports')
      .select(
        `
        *,
        project:projects(id, name, location),
        submitted_by_profile:profiles!incident_reports_submitted_by_fkey(id, full_name, avatar_url, job_title),
        reviewed_by_profile:profiles!incident_reports_reviewed_by_fkey(id, full_name),
        photos:report_photos(id, public_url, thumbnail_path, sort_order)
        `
      )
      .eq('submitted_by', user.id)
      .order('occurred_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as IncidentReportWithRelations[]) ?? [];
  },
};
