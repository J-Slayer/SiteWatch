/**
 * useAuth — convenience hook that reads from the auth store
 * and exposes typed helpers for components.
 */

import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { useUIStore } from '@/store/ui.store';

export function useAuth() {
  const { session, profile, isLoading } = useAuthStore();
  const showToast = useUIStore((s) => s.showToast);

  const isAuthenticated = !!session;
  const userId = session?.user?.id ?? null;
  const role = profile?.role ?? null;

  async function signOut() {
    try {
      await authService.signOut();
      useAuthStore.getState().clear();
    } catch {
      showToast('Failed to sign out. Please try again.', 'error');
    }
  }

  return {
    session,
    profile,
    isLoading,
    isAuthenticated,
    userId,
    role,
    signOut,
  };
}
