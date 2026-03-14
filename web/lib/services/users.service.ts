/**
 * Web users service — server-side Supabase queries for user management.
 */

import { createClient } from '@/lib/supabase/server';
import type { Profile, ProfileUpdate, Invitation, UserRole } from '@sitewatch/types';

export async function getUsers(companyId: string): Promise<Profile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ role } as ProfileUpdate)
    .eq('id', userId);

  if (error) throw error;
}

export async function deactivateUser(userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false } as ProfileUpdate)
    .eq('id', userId);

  if (error) throw error;
}

export async function getInvitations(companyId: string): Promise<Invitation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('company_id', companyId)
    .eq('accepted', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Invitation[];
}

export async function createInvitation(
  companyId: string,
  invitedBy: string,
  email: string,
  role: UserRole
): Promise<Invitation> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invitations')
    .insert({ company_id: companyId, invited_by: invitedBy, email, role })
    .select()
    .single();

  if (error) throw error;
  return data as Invitation;
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId);

  if (error) throw error;
}
