/**
 * Authenticated app layout — bottom tab navigator.
 * Redirects to login if the session is not present.
 */

import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { OfflineBanner } from '@/components/offline/OfflineBanner';
import { Colors } from '@/constants/theme';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function AppLayout() {
  const { session, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={styles.flex}>
      {/* Offline banner sits above the tab content */}
      <OfflineBanner />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary[600],
          tabBarInactiveTintColor: Colors.gray[400],
          tabBarStyle: {
            borderTopColor: Colors.border,
            backgroundColor: Colors.white,
            height: 60,
            paddingBottom: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text>,
          }}
        />
        <Tabs.Screen
          name="reports/index"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📋</Text>,
          }}
        />
        <Tabs.Screen
          name="reports/new/index"
          options={{
            title: 'Report',
            tabBarIcon: ({ color }) => (
              <View style={styles.newButton}>
                <Text style={{ fontSize: 22, color: Colors.white }}>＋</Text>
              </View>
            ),
            tabBarLabel: 'New Report',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text>,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  newButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
