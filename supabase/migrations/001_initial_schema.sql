-- ============================================================
-- SiteWatch — Initial Schema
-- Run this migration in the Supabase SQL Editor or via CLI:
--   supabase db push
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- for full-text search on reports

-- ── Enums ────────────────────────────────────────────────────────────────────
create type user_role as enum ('worker', 'supervisor', 'company_admin', 'super_admin');
create type project_status as enum ('active', 'completed', 'on_hold', 'archived');
create type incident_type as enum (
  'near_miss', 'injury', 'property_damage',
  'environmental', 'security', 'fire', 'other'
);
create type incident_severity as enum ('low', 'medium', 'high', 'critical');
create type report_status as enum ('draft', 'submitted', 'under_review', 'resolved', 'closed');
create type notification_type as enum (
  'new_report', 'status_update', 'assignment', 'mention', 'system'
);
create type subscription_tier as enum ('free', 'pro', 'enterprise');

-- ============================================================
-- COMPANIES
-- Multi-tenant root entity. Every piece of data links back here.
-- ============================================================
create table companies (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  slug                text not null unique,             -- URL-safe company identifier
  logo_url            text,
  industry            text,
  subscription_tier   subscription_tier not null default 'free',
  subscription_status text not null default 'active',
  max_users           int not null default 10,          -- enforced in app logic / RLS
  max_projects        int not null default 5,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- PROFILES
-- Extends auth.users. One row per authenticated user.
-- company_id is null only for super_admins.
-- ============================================================
create table profiles (
  id            uuid primary key references auth.users on delete cascade,
  company_id    uuid references companies(id) on delete set null,
  full_name     text not null,
  avatar_url    text,
  role          user_role not null default 'worker',
  phone         text,
  job_title     text,
  is_active     boolean not null default true,
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- PROJECTS / SITES
-- A company can have many projects. Reports belong to a project.
-- ============================================================
create table projects (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references companies(id) on delete cascade,
  name        text not null,
  description text,
  location    text,
  latitude    double precision,
  longitude   double precision,
  status      project_status not null default 'active',
  start_date  date,
  end_date    date,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PROJECT MEMBERS
-- Controls which users have access to which projects.
-- ============================================================
create table project_members (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references projects(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  role        text not null default 'member',      -- 'member' | 'lead'
  added_by    uuid references profiles(id) on delete set null,
  joined_at   timestamptz not null default now(),
  unique (project_id, user_id)
);

-- ============================================================
-- INCIDENT REPORTS
-- Core entity. Every field incident is captured here.
-- client_id is a device-generated UUID used to deduplicate offline syncs.
-- ============================================================
create table incident_reports (
  id                   uuid primary key default uuid_generate_v4(),
  company_id           uuid not null references companies(id) on delete cascade,
  project_id           uuid not null references projects(id) on delete cascade,
  submitted_by         uuid not null references profiles(id) on delete restrict,
  title                text not null,
  description          text not null,
  incident_type        incident_type not null,
  severity             incident_severity not null,
  status               report_status not null default 'submitted',
  location_description text,
  latitude             double precision,
  longitude            double precision,
  occurred_at          timestamptz not null,
  reported_at          timestamptz not null default now(),
  injured_person       text,
  witnesses            text[],
  client_id            uuid unique,               -- offline deduplication key
  reviewed_by          uuid references profiles(id) on delete set null,
  reviewed_at          timestamptz,
  resolution_notes     text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- GIN index for full-text search across title and description
create index incident_reports_fts_idx
  on incident_reports
  using gin ((to_tsvector('english', title || ' ' || description)));

-- Composite indexes for common dashboard filters
create index incident_reports_company_status_idx  on incident_reports(company_id, status);
create index incident_reports_company_severity_idx on incident_reports(company_id, severity);
create index incident_reports_project_idx          on incident_reports(project_id);
create index incident_reports_occurred_at_idx      on incident_reports(occurred_at desc);

-- ============================================================
-- REPORT PHOTOS
-- Photos uploaded alongside an incident report.
-- Stored in Supabase Storage; annotations are JSON blobs.
-- ============================================================
create table report_photos (
  id              uuid primary key default uuid_generate_v4(),
  report_id       uuid not null references incident_reports(id) on delete cascade,
  company_id      uuid not null references companies(id) on delete cascade,
  uploaded_by     uuid not null references profiles(id) on delete restrict,
  storage_path    text not null,                  -- e.g. "company-id/report-id/uuid.jpg"
  public_url      text,
  thumbnail_path  text,
  file_size_bytes int,
  mime_type       text not null default 'image/jpeg',
  annotations     jsonb not null default '[]',    -- PhotoAnnotation[]
  caption         text,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

create index report_photos_report_idx on report_photos(report_id);

-- ============================================================
-- NOTIFICATIONS
-- In-app and push notification records.
-- ============================================================
create table notifications (
  id           uuid primary key default uuid_generate_v4(),
  company_id   uuid not null references companies(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  report_id    uuid references incident_reports(id) on delete set null,
  title        text not null,
  body         text not null,
  type         notification_type not null,
  metadata     jsonb not null default '{}',
  is_read      boolean not null default false,
  push_sent    boolean not null default false,
  push_sent_at timestamptz,
  created_at   timestamptz not null default now()
);

create index notifications_user_unread_idx on notifications(user_id, is_read) where not is_read;

-- ============================================================
-- DEVICE TOKENS
-- Expo push tokens for mobile notifications.
-- ============================================================
create table device_tokens (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  token      text not null unique,             -- globally unique per device
  platform   text not null check (platform in ('ios', 'android')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INVITATIONS
-- Email invitations to join a company.
-- ============================================================
create table invitations (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references companies(id) on delete cascade,
  invited_by  uuid not null references profiles(id) on delete cascade,
  email       text not null,
  role        user_role not null default 'worker',
  token       uuid not null unique default uuid_generate_v4(),
  accepted    boolean not null default false,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- Automatically keep updated_at in sync.
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_updated_at        before update on companies        for each row execute procedure set_updated_at();
create trigger profiles_updated_at         before update on profiles         for each row execute procedure set_updated_at();
create trigger projects_updated_at         before update on projects         for each row execute procedure set_updated_at();
create trigger incident_reports_updated_at before update on incident_reports for each row execute procedure set_updated_at();
create trigger device_tokens_updated_at    before update on device_tokens    for each row execute procedure set_updated_at();

-- ============================================================
-- NEW USER TRIGGER
-- When a user signs up via Supabase Auth, create their profile.
-- company_name / invitation_token are passed via auth metadata.
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_company_id    uuid;
  v_role          user_role := 'worker';
  v_company_name  text;
  v_inv_token     uuid;
begin
  -- Check if an invitation token was provided
  v_inv_token := (new.raw_user_meta_data->>'invitation_token')::uuid;

  if v_inv_token is not null then
    -- Accept the invitation: look up company and role
    select company_id, role
    into   v_company_id, v_role
    from   invitations
    where  token      = v_inv_token
      and  accepted   = false
      and  expires_at > now();

    if v_company_id is not null then
      update invitations set accepted = true where token = v_inv_token;
    end if;

  elsif new.raw_user_meta_data->>'company_name' is not null then
    -- Create a new company for this user
    v_company_name := new.raw_user_meta_data->>'company_name';
    v_role         := 'company_admin';

    insert into companies (name, slug)
    values (
      v_company_name,
      lower(regexp_replace(v_company_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 6)
    )
    returning id into v_company_id;
  end if;

  -- Insert the profile
  insert into profiles (id, company_id, full_name, role)
  values (
    new.id,
    v_company_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_role
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Isolates data between companies. The golden rule:
--   "A user can only see/modify rows that belong to their company."
-- ============================================================

alter table companies         enable row level security;
alter table profiles          enable row level security;
alter table projects          enable row level security;
alter table project_members   enable row level security;
alter table incident_reports  enable row level security;
alter table report_photos     enable row level security;
alter table notifications     enable row level security;
alter table device_tokens     enable row level security;
alter table invitations       enable row level security;

-- Helper: get the authenticated user's company_id (cached per query)
create or replace function auth_company_id()
returns uuid language sql stable security definer as $$
  select company_id from profiles where id = auth.uid()
$$;

-- Helper: get the authenticated user's role
create or replace function auth_role()
returns user_role language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;

-- ── companies ─────────────────────────────────────────────────────────────────
-- Users can only read their own company
create policy "company_select" on companies for select
  using (id = auth_company_id());

-- Only super_admin can insert/update companies directly
create policy "company_insert" on companies for insert
  with check (auth_role() = 'super_admin');

create policy "company_update" on companies for update
  using (id = auth_company_id() and auth_role() in ('company_admin', 'super_admin'));

-- ── profiles ──────────────────────────────────────────────────────────────────
-- Users see all profiles within their company
create policy "profiles_select" on profiles for select
  using (company_id = auth_company_id() or id = auth.uid());

-- Users can update their own profile
create policy "profiles_update_own" on profiles for update
  using (id = auth.uid());

-- Company admins can update any profile in their company
create policy "profiles_update_admin" on profiles for update
  using (company_id = auth_company_id() and auth_role() in ('company_admin', 'super_admin'));

-- ── projects ──────────────────────────────────────────────────────────────────
create policy "projects_select" on projects for select
  using (company_id = auth_company_id());

create policy "projects_insert" on projects for insert
  with check (company_id = auth_company_id() and auth_role() in ('supervisor', 'company_admin', 'super_admin'));

create policy "projects_update" on projects for update
  using (company_id = auth_company_id() and auth_role() in ('supervisor', 'company_admin', 'super_admin'));

create policy "projects_delete" on projects for delete
  using (company_id = auth_company_id() and auth_role() in ('company_admin', 'super_admin'));

-- ── project_members ───────────────────────────────────────────────────────────
create policy "project_members_select" on project_members for select
  using (
    project_id in (select id from projects where company_id = auth_company_id())
  );

create policy "project_members_insert" on project_members for insert
  with check (
    project_id in (select id from projects where company_id = auth_company_id())
    and auth_role() in ('supervisor', 'company_admin', 'super_admin')
  );

create policy "project_members_delete" on project_members for delete
  using (
    project_id in (select id from projects where company_id = auth_company_id())
    and auth_role() in ('supervisor', 'company_admin', 'super_admin')
  );

-- ── incident_reports ──────────────────────────────────────────────────────────
-- All company members can read all reports
create policy "reports_select" on incident_reports for select
  using (company_id = auth_company_id());

-- Any authenticated company member can submit a report
create policy "reports_insert" on incident_reports for insert
  with check (company_id = auth_company_id() and submitted_by = auth.uid());

-- Submitter can update their own draft; supervisors/admins can update any
create policy "reports_update" on incident_reports for update
  using (
    company_id = auth_company_id()
    and (
      (submitted_by = auth.uid() and status = 'draft')
      or auth_role() in ('supervisor', 'company_admin', 'super_admin')
    )
  );

-- ── report_photos ─────────────────────────────────────────────────────────────
create policy "photos_select" on report_photos for select
  using (company_id = auth_company_id());

create policy "photos_insert" on report_photos for insert
  with check (company_id = auth_company_id() and uploaded_by = auth.uid());

create policy "photos_delete" on report_photos for delete
  using (
    company_id = auth_company_id()
    and (uploaded_by = auth.uid() or auth_role() in ('supervisor', 'company_admin', 'super_admin'))
  );

-- ── notifications ─────────────────────────────────────────────────────────────
create policy "notifications_select" on notifications for select
  using (user_id = auth.uid());

create policy "notifications_update" on notifications for update
  using (user_id = auth.uid());

-- ── device_tokens ─────────────────────────────────────────────────────────────
create policy "device_tokens_all" on device_tokens for all
  using (user_id = auth.uid());

-- ── invitations ───────────────────────────────────────────────────────────────
create policy "invitations_select" on invitations for select
  using (company_id = auth_company_id() and auth_role() in ('company_admin', 'super_admin'));

create policy "invitations_insert" on invitations for insert
  with check (company_id = auth_company_id() and auth_role() in ('company_admin', 'super_admin'));

-- ============================================================
-- STORAGE BUCKETS
-- Run in Supabase Dashboard → Storage → New Bucket
-- Or via Supabase CLI: supabase storage create report-photos
-- ============================================================

-- report-photos bucket (private — access via signed URLs or RLS)
-- Naming convention: {company_id}/{report_id}/{uuid}.{ext}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-photos',
  'report-photos',
  false,
  10485760,   -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- avatars bucket (public reads)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,    -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Storage RLS: users can upload to their company folder only
create policy "report_photos_upload" on storage.objects for insert
  with check (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth_company_id()::text
  );

create policy "report_photos_read" on storage.objects for select
  using (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth_company_id()::text
  );

create policy "report_photos_delete" on storage.objects for delete
  using (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth_company_id()::text
    and auth_role() in ('supervisor', 'company_admin', 'super_admin')
  );

create policy "avatars_upload" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);

create policy "avatars_read" on storage.objects for select
  using (bucket_id = 'avatars');

-- ============================================================
-- SEED: Analytics helper view
-- Used by the admin dashboard for the overview stats panel.
-- ============================================================
create or replace view company_report_stats as
select
  company_id,
  count(*)                                                          as total_reports,
  count(*) filter (where status not in ('resolved', 'closed'))      as open_reports,
  count(*) filter (where severity = 'critical')                     as critical_reports,
  count(*) filter (where occurred_at >= now() - interval '30 days') as reports_last_30d,
  count(*) filter (where occurred_at >= now() - interval '7 days')  as reports_last_7d
from incident_reports
group by company_id;

-- Grant access to the authenticated role
grant select on company_report_stats to authenticated;
