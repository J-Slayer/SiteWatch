/**
 * Auth service — wraps Supabase Auth methods.
 * Keeps all auth logic out of components.
 */

import { supabase } from './supabase';
import type { RegisterRequest, LoginRequest } from '@sitewatch/types';

export const authService = {
  /**
   * Sign in with email and password.
   */
  async signIn({ email, password }: LoginRequest) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Register a new user.
   * If companyName is provided, creates a new company and sets user as company_admin.
   * If invitationToken is provided, joins an existing company.
   */
  async signUp({ email, password, fullName, companyName, invitationToken }: RegisterRequest) {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
          invitation_token: invitationToken,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Sign out and clear local session.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get the current session (null if not authenticated).
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Fetch the current user's profile from the database.
   */
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Send a password reset email.
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim()
    );
    if (error) throw error;
  },

  /**
   * Subscribe to auth state changes.
   * Returns an unsubscribe function.
   */
  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return data.subscription.unsubscribe;
  },
};
