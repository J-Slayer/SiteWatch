/**
 * useNotifications — registers the device for push notifications on mount
 * and sets up foreground/tap listeners.
 *
 * Call this once from the root authenticated layout so it runs when a
 * user session is active and we can associate the token with their account.
 */

import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import type { Subscription } from 'expo-notifications';
import { notificationService } from '@/services/notification.service';

export function useNotifications() {
  const tokenRef = useRef<string | null>(null);
  const foregroundSub = useRef<Subscription | null>(null);
  const responseSub = useRef<Subscription | null>(null);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      const token = await notificationService.registerForPushNotifications();
      if (mounted) tokenRef.current = token;
    }

    setup();

    // Foreground notification — just log for now; badge handled by handler config
    foregroundSub.current = notificationService.addForegroundListener((notification) => {
      console.log('[notifications] Received in foreground:', notification.request.identifier);
    });

    // User tapped a notification — navigate to the relevant report if possible
    responseSub.current = notificationService.addResponseListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.reportId && typeof data.reportId === 'string') {
        router.push(`/(app)/reports/${data.reportId}`);
      }
    });

    return () => {
      mounted = false;
      foregroundSub.current?.remove();
      responseSub.current?.remove();

      // Unregister token on cleanup (sign-out clears the session, triggering this)
      if (tokenRef.current) {
        notificationService.unregisterToken(tokenRef.current).catch(() => {});
      }
    };
  }, []);
}
