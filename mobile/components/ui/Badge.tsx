import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, FontSize, Spacing } from '@/constants/theme';
import type { IncidentSeverity, ReportStatus } from '@sitewatch/types';

// Severity badge
interface SeverityBadgeProps {
  severity: IncidentSeverity;
  style?: ViewStyle;
}

const severityConfig: Record<IncidentSeverity, { bg: string; text: string; label: string }> = {
  low: { bg: '#DCFCE7', text: Colors.severity.low, label: 'Low' },
  medium: { bg: '#FEF9C3', text: Colors.severity.medium, label: 'Medium' },
  high: { bg: '#FFEDD5', text: Colors.severity.high, label: 'High' },
  critical: { bg: '#FEE2E2', text: Colors.severity.critical, label: 'Critical' },
};

export function SeverityBadge({ severity, style }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

// Status badge
interface StatusBadgeProps {
  status: ReportStatus;
  style?: ViewStyle;
}

const statusConfig: Record<ReportStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: Colors.gray[100], text: Colors.gray[600], label: 'Draft' },
  submitted: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Submitted' },
  under_review: { bg: '#FEF9C3', text: '#A16207', label: 'Under Review' },
  resolved: { bg: '#DCFCE7', text: '#15803D', label: 'Resolved' },
  closed: { bg: Colors.gray[100], text: Colors.gray[500], label: 'Closed' },
};

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

// Generic badge
interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
  style?: ViewStyle;
}

export function Badge({ label, color = Colors.primary[600], bg = Colors.primary[50], style }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
