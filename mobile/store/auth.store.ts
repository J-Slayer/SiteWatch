/**
 * Global auth state managed by Zustand.
 * Components read from here; the root layout populates it.
 */

import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@sitewatch/types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  clear: () => set({ session: null, profile: null, isLoading: false }),
}));
