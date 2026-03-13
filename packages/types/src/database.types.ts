/**
 * Auto-generated Supabase database types.
 * After connecting your Supabase project, regenerate with:
 *   npx supabase gen types typescript --project-id <project-id> > packages/types/src/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Enums ─────────────────────────────────────────────────────────────────────

export type UserRole = 'worker' | 'supervisor' | 'company_admin' | 'super_admin';
export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'archived';
export type IncidentType =
  | 'near_miss'
  | 'injury'
  | 'property_damage'
  | 'environmental'
  | 'security'
  | 'fire'
  | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus = 'draft' | 'submitted' | 'under_review' | 'resolved' | 'closed';
export type NotificationType = 'new_report' | 'status_update' | 'assignment' | 'mention' | 'system';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

// ── Table Row Types ───────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: string;
  max_users: number;
  max_projects: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  company_id: string | null;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  phone: string | null;
  job_title: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  added_by: string | null;
  joined_at: string;
}

export interface IncidentReport {
  id: string;
  company_id: string;
  project_id: string;
  submitted_by: string;
  title: string;
  description: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  status: ReportStatus;
  location_description: string | null;
  latitude: number | null;
  longitude: number | null;
  occurred_at: string;
  reported_at: string;
  injured_person: string | null;
  witnesses: string[] | null;
  client_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportPhoto {
  id: string;
  report_id: string;
  company_id: string;
  uploaded_by: string;
  storage_path: string;
  public_url: string | null;
  thumbnail_path: string | null;
  file_size_bytes: number | null;
  mime_type: string;
  annotations: PhotoAnnotation[];
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface Notification {
  id: string;
  company_id: string;
  user_id: string;
  report_id: string | null;
  title: string;
  body: string;
  type: NotificationType;
  metadata: Json;
  is_read: boolean;
  push_sent: boolean;
  push_sent_at: string | null;
  created_at: string;
}

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  is_active: boolean;
  created_at: string;
}

export interface Invitation {
  id: string;
  company_id: string;
  invited_by: string;
  email: string;
  role: UserRole;
  token: string;
  accepted: boolean;
  expires_at: string;
  created_at: string;
}

// ── Annotation Types ──────────────────────────────────────────────────────────

export interface PhotoAnnotation {
  id: string;
  type: 'arrow' | 'rect' | 'circle' | 'text' | 'freehand';
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  text?: string;
  color: string;
  strokeWidth: number;
}

// ── Insert Types (omit auto-generated fields) ─────────────────────────────────

export type CompanyInsert = Omit<Company, 'id' | 'created_at' | 'updated_at'>;
export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;
export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'>;
export type IncidentReportInsert = Omit<IncidentReport, 'id' | 'created_at' | 'updated_at'>;
export type ReportPhotoInsert = Omit<ReportPhoto, 'id' | 'created_at'>;

// ── Update Types ──────────────────────────────────────────────────────────────

export type ProjectUpdate = Partial<ProjectInsert>;
export type IncidentReportUpdate = Partial<IncidentReportInsert>;
export type ProfileUpdate = Partial<Omit<ProfileInsert, 'id'>>;

// ── Extended/Joined Types ────────────────────────────────────────────────────

export interface IncidentReportWithRelations extends IncidentReport {
  project: Pick<Project, 'id' | 'name' | 'location'>;
  submitted_by_profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'job_title'>;
  reviewed_by_profile?: Pick<Profile, 'id' | 'full_name'> | null;
  photos: ReportPhoto[];
}

export interface ProjectWithStats extends Project {
  member_count: number;
  open_reports_count: number;
  critical_reports_count: number;
}
