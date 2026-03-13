import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useConnectivity } from '@/hooks/useConnectivity';
import { Colors, FontSize, Spacing } from '@/constants/theme';

export function OfflineBanner() {
  const { isOnline, isChecking } = useConnectivity();

  if (isChecking || isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>⚡</Text>
      <Text style={styles.text}>
        You're offline — reports will sync when connection is restored
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  icon: {
    fontSize: FontSize.base,
  },
  text: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: '500',
  },
});
