import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadow } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md';
}

export function Card({ children, style, padding = 'md', shadow = 'sm' }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        padding !== 'none' && styles[`padding_${padding}`],
        shadow !== 'none' && Shadow[shadow],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  padding_sm: { padding: Spacing.md },
  padding_md: { padding: Spacing.base },
  padding_lg: { padding: Spacing.xl },
});
