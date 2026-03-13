/**
 * Root layout — bootstraps auth state, decides which route group to show.
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
import type { Profile } from '@sitewatch/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
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
 * AuthBootstrap — subscribes to Supabase auth changes
 * and keeps the Zustand store in sync.
 * Expo Router's <Slot> + (auth)/(app) groups handle the actual routing.
 */
function AuthBootstrap() {
  const { setSession, setProfile, setLoading, clear } = useAuthStore();

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
      } else {
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
