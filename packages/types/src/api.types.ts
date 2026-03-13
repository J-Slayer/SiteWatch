/**
 * API request/response types shared between mobile and web.
 */

import type { IncidentType, IncidentSeverity, UserRole } from './database.types';

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  /** If provided, user joins this company as worker/supervisor */
  invitationToken?: string;
  /** If provided, creates a new company and sets user as company_admin */
  companyName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ── Report submission ─────────────────────────────────────────────────────────

export interface SubmitReportRequest {
  projectId: string;
  title: string;
  description: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  occurredAt: string;       // ISO 8601
  locationDescription?: string;
  latitude?: number;
  longitude?: number;
  injuredPerson?: string;
  witnesses?: string[];
  /** Device-generated UUID for offline deduplication */
  clientId: string;
}

export interface SubmitReportResponse {
  reportId: string;
  status: 'submitted';
}

// ── PDF export ────────────────────────────────────────────────────────────────

export interface ExportReportRequest {
  reportId: string;
}

// ── Push notifications ────────────────────────────────────────────────────────

export interface RegisterDeviceRequest {
  token: string;
  platform: 'ios' | 'android';
}

// ── Invite users ──────────────────────────────────────────────────────────────

export interface InviteUserRequest {
  email: string;
  role: UserRole;
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface ReportFilters {
  projectId?: string;
  severity?: IncidentSeverity;
  status?: string;
  incidentType?: IncidentType;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ── Generic API response ──────────────────────────────────────────────────────

export interface ApiResponse<T = void> {
  data?: T;
  error?: string;
}
