/**
 * Home screen — shows a greeting, quick action to file a report,
 * and a summary of recent activity.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
            <Text style={styles.subtitle}>Stay safe on site</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
        </View>

        {/* Quick action — primary CTA */}
        <TouchableOpacity
          style={styles.reportCta}
          activeOpacity={0.85}
          onPress={() => router.push('/(app)/reports/new')}
        >
          <Text style={styles.reportCtaIcon}>⚠️</Text>
          <View style={styles.reportCtaText}>
            <Text style={styles.reportCtaTitle}>Report an Incident</Text>
            <Text style={styles.reportCtaSubtitle}>
              Tap to submit a safety report right now
            </Text>
          </View>
          <Text style={styles.reportCtaArrow}>›</Text>
        </TouchableOpacity>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard label="This Week" value="—" icon="📊" />
          <StatCard label="Open Reports" value="—" icon="🔴" />
          <StatCard label="Resolved" value="—" icon="✅" />
        </View>

        {/* Recent activity placeholder */}
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No recent reports.{'\n'}Tap the + button to submit a new incident.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <Card style={styles.statCard} padding="sm">
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.lg,
  },
  reportCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[600],
    borderRadius: 16,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  reportCtaIcon: { fontSize: 32 },
  reportCtaText: { flex: 1 },
  reportCtaTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  reportCtaSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.primary[200],
    marginTop: 2,
  },
  reportCtaArrow: {
    fontSize: 28,
    color: Colors.primary[300],
    fontWeight: FontWeight.bold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statIcon: { fontSize: 20 },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
