import Constants from 'expo-constants';

/**
 * Central app configuration.
 * All env vars are read once here and exported as typed constants.
 */

const extra = Constants.expoConfig?.extra ?? {};

export const Config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? '',
  },
  app: {
    name: 'SiteWatch',
    version: Constants.expoConfig?.version ?? '1.0.0',
  },
  offline: {
    /** Maximum number of records to keep in the local sync queue */
    maxQueueSize: 500,
    /** Background sync interval in milliseconds */
    syncIntervalMs: 30_000,
  },
  pagination: {
    defaultPageSize: 20,
  },
} as const;

// Validate required config at startup
if (!Config.supabase.url || !Config.supabase.anonKey) {
  console.warn(
    '[SiteWatch] Missing Supabase configuration. ' +
      'Copy mobile/.env.example to mobile/.env.local and fill in your credentials.'
  );
}
