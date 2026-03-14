/**
 * OfflineBanner — slides down when offline, slides back up when reconnected.
 * Uses Reanimated for a smooth spring animation.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useConnectivity } from '@/hooks/useConnectivity';
import { Colors, FontSize, Spacing } from '@/constants/theme';

const BANNER_HEIGHT = 36;

export function OfflineBanner() {
  const { isOnline, isChecking } = useConnectivity();
  const translateY = useSharedValue(-BANNER_HEIGHT);

  useEffect(() => {
    if (isChecking) return;

    if (!isOnline) {
      // Slide in
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    } else {
      // Slide out after brief delay (so user sees "back online" if we add that)
      translateY.value = withDelay(300, withSpring(-BANNER_HEIGHT, { damping: 18, stiffness: 200 }));
    }
  }, [isOnline, isChecking]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.banner, animatedStyle]}>
      <Text style={styles.icon}>⚡</Text>
      <Text style={styles.text}>
        You're offline — reports will sync when connection is restored
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning ?? '#D97706',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    height: BANNER_HEIGHT,
    overflow: 'hidden',
  },
  icon: { fontSize: FontSize.base },
  text: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: '500',
  },
});
