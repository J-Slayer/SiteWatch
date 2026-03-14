/**
 * Root layout — bootstraps auth state, push notifications, and background sync.
 * Expo Router renders this for every route in the app.
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { supabase } from '@/services/supabase';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { useNotifications } from '@/hooks/useNotifications';
import { registerBackgroundSync, unregisterBackgroundSync } from '@/tasks/backgroundSync.task';
import type { Profile } from '@sitewatch/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

/**
 * AuthBootstrap — subscribes to Supabase auth changes, keeps Zustand in sync,
 * and manages push notification + background sync lifecycle.
 */
function AuthBootstrap() {
  const { setSession, setProfile, setLoading, clear, session } = useAuthStore();

  // Register push notification listeners (runs once on mount)
  useNotifications();

  useEffect(() => {
    // Check for an existing session on launch
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        try {
          const profile = await authService.getProfile(session.user.id);
          setProfile(profile as unknown as Profile);
        } catch {
          // Profile fetch failed; still mark as loaded
        }
        // Start background sync when a session is present
        await registerBackgroundSync();
      }
      setLoading(false);
    });

    // Subscribe to future auth state changes
    const unsubscribe = authService.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (session?.user) {
        try {
          const profile = await authService.getProfile(session.user.id);
          setProfile(profile as unknown as Profile);
        } catch {
          setProfile(null);
        }
        // Ensure background sync is registered after login
        await registerBackgroundSync();
      } else {
        // User signed out — stop background sync
        await unregisterBackgroundSync();
        clear();
      }
    });

    return unsubscribe;
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
