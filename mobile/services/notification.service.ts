/**
 * Notification service — manages push notification permissions,
 * device token registration, and local notification display.
 *
 * Flow:
 *  1. App launches → registerForPushNotifications() called
 *  2. OS permission prompt shown if not yet granted
 *  3. Expo push token fetched and saved to `device_tokens` table in Supabase
 *  4. Incoming notifications handled via listener callbacks
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  /**
   * Request permission and register the device's Expo push token.
   * Saves the token to the `device_tokens` table so the server can
   * send targeted pushes to this device.
   *
   * Returns the token string, or null if permission was denied / not a device.
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      console.log('[notifications] Skipping token registration on simulator.');
      return null;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[notifications] Permission denied.');
      return null;
    }

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'SiteWatch Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Save token to Supabase
    await notificationService.saveToken(token);

    return token;
  },

  /**
   * Upsert the device token in the `device_tokens` table.
   * Uses the token value as the conflict key so duplicate rows are avoided.
   */
  async saveToken(token: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    const { error } = await supabase
      .from('device_tokens')
      .upsert(
        {
          user_id: user.id,
          token,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      );

    if (error) {
      console.warn('[notifications] Failed to save device token:', error.message);
    }
  },

  /**
   * Remove this device's token from the database on sign-out,
   * so the user no longer receives push notifications on this device.
   */
  async unregisterToken(token: string): Promise<void> {
    await supabase.from('device_tokens').delete().eq('token', token);
  },

  /**
   * Show a local notification immediately (no server round-trip).
   * Useful for confirming offline report saves, sync completions, etc.
   */
  async showLocal({
    title,
    body,
    data = {},
  }: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null, // fire immediately
    });
  },

  /**
   * Add a listener for notifications received while the app is foregrounded.
   * Returns the subscription — call .remove() to clean up.
   */
  addForegroundListener(
    handler: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(handler);
  },

  /**
   * Add a listener for when the user taps a notification.
   * Returns the subscription — call .remove() to clean up.
   */
  addResponseListener(
    handler: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },

  /** Get the current badge count. */
  async getBadgeCount(): Promise<number> {
    return Notifications.getBadgeCountAsync();
  },

  /** Clear the app badge. */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  },
};
