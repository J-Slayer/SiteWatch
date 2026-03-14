/**
 * Reports list screen — shows all reports submitted by this user.
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useMyReports } from '@/hooks/useReports';
import type { IncidentReportWithRelations } from '@sitewatch/types';

const SEVERITY_COLORS: Record<string, string> = {
  low: '#16A34A',
  medium: '#D97706',
  high: '#EA580C',
  critical: '#DC2626',
};

export default function ReportsScreen() {
  const { data: reports = [], isLoading, isError, refetch, isRefetching } = useMyReports();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Reports</Text>
          {!isLoading && (
            <Text style={styles.subtitle}>
              {reports.length === 0
                ? 'No reports submitted yet'
                : `${reports.length} report${reports.length !== 1 ? 's' : ''} total`}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/(app)/reports/new')}
          activeOpacity={0.8}
        >
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#FF8C00" size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <View style={styles.errorIconBadge}>
            <Text style={styles.errorIcon}>⚠️</Text>
          </View>
          <Text style={styles.errorTitle}>Failed to load reports</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, reports.length === 0 && styles.listEmpty]}
          ListEmptyComponent={<EmptyState />}
          renderItem={({ item, index }) => <ReportCard report={item} index={index} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#FF8C00"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function ReportCard({ report, index }: { report: IncidentReportWithRelations; index: number }) {
  const severityColor = SEVERITY_COLORS[report.severity] ?? Colors.textSecondary;
  const date = new Date(report.occurred_at).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/(app)/reports/${report.id}`)}
      >
        <View style={styles.card}>
          {/* Left severity stripe */}
          <View style={[styles.severityStripe, { backgroundColor: severityColor }]} />

          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {report.title}
              </Text>
              <Text style={styles.cardDate}>{date}</Text>
            </View>

            <Text style={styles.cardDescription} numberOfLines={2}>
              {report.description}
            </Text>

            <View style={styles.cardFooter}>
              <SeverityBadge severity={report.severity} />
              <StatusBadge status={report.status} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconBadge}>
        <Text style={styles.emptyIcon}>📋</Text>
      </View>
      <Text style={styles.emptyTitle}>No reports yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the + New button above to submit your first incident report.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/(app)/reports/new')}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyButtonText}>+ Create Report</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F2F5' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  newButton: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  newButtonText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },

  list: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  listEmpty: {
    flexGrow: 1,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  errorIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: { fontSize: 32 },
  errorTitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  retryButton: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
  },
  retryText: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  severityStripe: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  cardDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  cardDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 2,
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  emptyIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FFF5EC',
    borderWidth: 1,
    borderColor: '#FFE4C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: Spacing.sm,
    backgroundColor: '#FF8C00',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyButtonText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.base,
  },
});
