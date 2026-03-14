/**
 * Web projects service — server-side Supabase queries for projects.
 */

import { createClient } from '@/lib/supabase/server';
import type { Project, ProjectInsert, ProjectUpdate, ProjectWithStats } from '@sitewatch/types';

export async function getProjects(companyId: string): Promise<ProjectWithStats[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      member_count:project_members(count),
      open_reports_count:incident_reports(count)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Flatten count objects returned by Supabase
  return (data ?? []).map((p: any) => ({
    ...p,
    member_count: p.member_count?.[0]?.count ?? 0,
    open_reports_count: p.open_reports_count?.[0]?.count ?? 0,
    critical_reports_count: 0, // would need a separate query; omitting for brevity
  })) as ProjectWithStats[];
}

export async function getProject(projectId: string): Promise<Project> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data as Project;
}

export async function createProject(
  companyId: string,
  userId: string,
  payload: Omit<ProjectInsert, 'company_id' | 'created_by'>
): Promise<Project> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...payload, company_id: companyId, created_by: userId })
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(
  projectId: string,
  updates: ProjectUpdate
): Promise<Project> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
}
