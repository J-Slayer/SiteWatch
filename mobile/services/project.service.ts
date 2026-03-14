/**
 * Project service — fetches projects the user has access to.
 * Used to populate the project picker on the incident report form.
 */

import { supabase } from './supabase';
import type { Project } from '@sitewatch/types';

export const projectService = {
  /**
   * Return all active projects the current user is a member of
   * (or all active projects in their company if they're admin/supervisor).
   */
  async getAccessibleProjects(): Promise<Project[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single();

    const isElevated = profile?.role === 'company_admin' ||
      profile?.role === 'super_admin' ||
      profile?.role === 'supervisor';

    if (isElevated) {
      // Admins and supervisors see all active projects in their company
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', profile!.company_id!)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data as Project[];
    } else {
      // Workers see only projects they are a member of
      const { data, error } = await supabase
        .from('project_members')
        .select('project:projects(*)')
        .eq('user_id', user.id);

      if (error) throw error;

      return (data ?? [])
        .map((row: any) => row.project as Project)
        .filter((p) => p && p.status === 'active');
    }
  },

  /**
   * Get a single project by ID.
   */
  async getProject(projectId: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data as Project;
  },
};
