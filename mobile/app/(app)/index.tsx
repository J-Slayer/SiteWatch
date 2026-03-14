/**
 * Home screen — greeting, quick report CTA, live stats, and recent reports.
 * Stats are derived from the user's own reports via useMyReports.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useMyReports } from '@/hooks/useReports';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import type { IncidentReport } from '@sitewatch/types';

const SEVERITY_COLORS: Record<string, string> = {
  low: Colors.success ?? '#16A34A',
  medium: '#D97706',
  high: '#EA580C',
  critical: Colors.danger,
};

export default function HomeScreen() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  const { data: reports = [], isLoading, refetch, isRefetching } = useMyReports();

  // Derive stats from the reports list
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeek = reports.filter(
      (r) => new Date(r.occurred_at) >= weekAgo
    ).length;

    const open = reports.filter((r) =>
      ['submitted', 'under_review'].includes(r.status)
    ).length;

    const resolved = reports.filter((r) => r.status === 'resolved').length;

    return { thisWeek, open, resolved };
  }, [reports]);

  const recentReports = reports.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary[600]}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
            <Text style={styles.subtitle}>Stay safe on site</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push('/(app)/profile')}
          >
            <Text style={styles.avatarText}>
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick action — primary CTA */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <TouchableOpacity
            style={styles.reportCta}
            activeOpacity={0.85}
            onPress={() => router.push('/(app)/reports/new')}
          >
            <View style={styles.reportCtaIconWrap}>
              <Text style={styles.reportCtaIcon}>⚠️</Text>
            </View>
            <View style={styles.reportCtaText}>
              <Text style={styles.reportCtaTitle}>Report an Incident</Text>
              <Text style={styles.reportCtaSubtitle}>
                Tap to submit a safety report right now
              </Text>
            </View>
            <Text style={styles.reportCtaArrow}>›</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats row */}
        {isLoading ? (
          <View style={styles.statsRow}>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </View>
        ) : (
          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.statsRow}>
            <StatCard label="This Week" value={stats.thisWeek} icon="📊" index={0} />
            <StatCard label="Open" value={stats.open} icon="🔴" index={1} />
            <StatCard label="Resolved" value={stats.resolved} icon="✅" index={2} />
          </Animated.View>
        )}

        {/* Recent reports */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          {reports.length > 3 && (
            <TouchableOpacity onPress={() => router.push('/(app)/reports')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {isLoading ? (
          <Card style={styles.loadingCard}>
            <ActivityIndicator color={Colors.primary[600]} />
          </Card>
        ) : recentReports.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No reports yet.</Text>
            <Text style={styles.emptySubtext}>
              Tap the button above to submit your first incident report.
            </Text>
          </Card>
        ) : (
          recentReports.map((report) => (
            <RecentReportRow key={report.id} report={report} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const STAT_ACCENT_COLORS = ['#FF8C00', '#2563EB', '#16A34A'];

function StatCard({ label, value, icon, index = 0 }: { label: string; value: number; icon: string; index?: number }) {
  const accentColor = STAT_ACCENT_COLORS[index] ?? '#FF8C00';
  return (
    <Animated.View entering={ZoomIn.delay(200 + index * 60).duration(300)} style={styles.statCardWrapper}>
      <Card style={styles.statCard} padding="none" shadow="sm">
        <View style={[styles.statAccent, { backgroundColor: accentColor }]} />
        <View style={styles.statCardInner}>
          <View style={[styles.statIconBadge, { backgroundColor: accentColor + '18' }]}>
            <Text style={styles.statIcon}>{icon}</Text>
          </View>
          <Text style={[styles.statValue, { color: accentColor }]}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </Card>
    </Animated.View>
  );
}

function StatCardSkeleton() {
  return (
    <Card style={styles.statCard} padding="none" shadow="sm">
      <View style={[styles.statAccent, { backgroundColor: Colors.gray[200] }]} />
      <View style={styles.statCardInner}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonValue} />
        <View style={styles.skeletonLabel} />
      </View>
    </Card>
  );
}

function RecentReportRow({ report }: { report: IncidentReport }) {
  const severityColor = SEVERITY_COLORS[report.severity] ?? Colors.textSecondary;
  const date = new Date(report.occurred_at).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/(app)/reports/${report.id}`)}
    >
      <Card style={styles.reportRow} padding="sm">
        {/* Severity stripe */}
        <View style={[styles.severityStripe, { backgroundColor: severityColor }]} />

        <View style={styles.reportRowContent}>
          <View style={styles.reportRowTop}>
            <Text style={styles.reportTitle} numberOfLines={1}>
              {report.title}
            </Text>
            <Text style={styles.reportDate}>{date}</Text>
          </View>
          <View style={styles.reportRowBottom}>
            <Badge severity={report.severity} />
            <Badge status={report.status} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F2F5' },
  container: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },

  // Header
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[600],
  },
  avatarText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.lg,
  },

  // CTA
  reportCta: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: Colors.primary[700],
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
    shadowColor: Colors.primary[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  reportCtaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,140,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCtaIcon: { fontSize: 26 },
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

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCardWrapper: { flex: 1 },
  statCard: {
    flex: 1,
    overflow: 'hidden',
  },
  statAccent: {
    height: 3,
    width: '100%',
  },
  statCardInner: {
    alignItems: 'center',
    gap: 2,
    padding: Spacing.md,
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statIcon: { fontSize: 18 },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Skeleton
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.gray[200],
  },
  skeletonValue: {
    width: 32,
    height: 20,
    borderRadius: 4,
    backgroundColor: Colors.gray[200],
    marginTop: 4,
  },
  skeletonLabel: {
    width: 48,
    height: 12,
    borderRadius: 4,
    backgroundColor: Colors.gray[100],
    marginTop: 4,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: FontSize.sm,
    color: '#FF8C00',
    fontWeight: FontWeight.semibold,
  },

  // Empty / loading
  loadingCard: {
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 36 },
  emptyText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Recent report row
  reportRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    padding: 0,
  },
  severityStripe: {
    width: 4,
    borderRadius: 4,
  },
  reportRowContent: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  reportRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTitle: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  reportDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  reportRowBottom: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 2,
  },
});
