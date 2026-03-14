/**
 * Report detail screen — shows full incident report with photos.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useReport } from '@/hooks/useReports';
import { Card } from '@/components/ui/Card';
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { Colors, FontSize, FontWeight, Spacing, Shadow } from '@/constants/theme';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: report, isLoading, isError } = useReport(id ?? '');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Navbar />
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary[600]} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !report) {
    return (
      <SafeAreaView style={styles.safe}>
        <Navbar />
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load report.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Navbar />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerBadges}>
            <SeverityBadge severity={report.severity} />
            <StatusBadge status={report.status} />
          </View>
          <Text style={styles.date}>
            {new Date(report.occurred_at).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>

        <Text style={styles.title}>{report.title}</Text>

        {/* Metadata grid */}
        <Card style={styles.metaCard}>
          <MetaRow label="Type" value={report.incident_type.replace('_', ' ')} />
          <MetaRow label="Site" value={report.project?.name ?? '—'} />
          {report.location_description && (
            <MetaRow label="Location" value={report.location_description} />
          )}
          {report.injured_person && (
            <MetaRow label="Injured person" value={report.injured_person} />
          )}
          {report.witnesses && report.witnesses.length > 0 && (
            <MetaRow label="Witnesses" value={report.witnesses.join(', ')} />
          )}
          <MetaRow
            label="Submitted by"
            value={report.submitted_by_profile?.full_name ?? '—'}
          />
          <MetaRow
            label="Reported at"
            value={new Date(report.reported_at).toLocaleString()}
            last
          />
        </Card>

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <Card>
          <Text style={styles.description}>{report.description}</Text>
        </Card>

        {/* Resolution notes (if resolved) */}
        {report.resolution_notes && (
          <>
            <Text style={styles.sectionTitle}>Resolution Notes</Text>
            <Card>
              <Text style={styles.description}>{report.resolution_notes}</Text>
              {report.reviewed_by_profile && (
                <Text style={styles.reviewedBy}>
                  — Reviewed by {report.reviewed_by_profile.full_name}
                  {report.reviewed_at &&
                    ` on ${new Date(report.reviewed_at).toLocaleDateString()}`}
                </Text>
              )}
            </Card>
          </>
        )}

        {/* Photos */}
        {report.photos && report.photos.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Photos ({report.photos.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosRow}
            >
              {report.photos
                .slice()
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((photo) => (
                  <View key={photo.id} style={styles.photoWrapper}>
                    {photo.public_url ? (
                      <Image
                        source={{ uri: photo.public_url }}
                        style={styles.photo}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.photo, styles.photoPlaceholder]}>
                        <Text style={styles.photoPlaceholderText}>📷</Text>
                      </View>
                    )}
                    {photo.caption && (
                      <Text style={styles.photoCaption} numberOfLines={2}>
                        {photo.caption}
                      </Text>
                    )}
                  </View>
                ))}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Navbar() {
  return (
    <View style={styles.navbar}>
      <TouchableOpacity
        onPress={() => router.back()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.navBack}>‹ Back</Text>
      </TouchableOpacity>
      <Text style={styles.navTitle}>Report Details</Text>
      <View style={{ width: 60 }} />
    </View>
  );
}

function MetaRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[styles.metaRow, !last && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}
    >
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: FontSize.base, color: Colors.textSecondary },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navBack: {
    fontSize: FontSize.base,
    color: Colors.primary[600],
    fontWeight: FontWeight.medium,
    width: 60,
  },
  navTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  container: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerBadges: { flexDirection: 'row', gap: Spacing.sm },
  date: { fontSize: FontSize.xs, color: Colors.textSecondary },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
    lineHeight: 30,
  },
  metaCard: { marginBottom: Spacing.base },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  metaLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  metaValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    flex: 2,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
  },
  description: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  reviewedBy: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  photosRow: { gap: Spacing.md, paddingBottom: Spacing.sm },
  photoWrapper: { width: 200 },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 10,
    backgroundColor: Colors.gray[100],
    ...Shadow.sm,
  },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { fontSize: 40 },
  photoCaption: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
});
