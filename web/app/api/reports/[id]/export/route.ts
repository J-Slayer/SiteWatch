/**
 * GET /api/reports/[id]/export
 *
 * Generates and returns a PDF of an incident report.
 * Uses @react-pdf/renderer to build the PDF server-side.
 *
 * Authentication: validated via Supabase session cookie (middleware handles
 * unauthenticated requests before they reach here).
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { getReport } from '@/lib/services/reports.service';
import { formatDateTime, snakeToTitle } from '@/lib/utils';

// ── PDF Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 48,
    fontSize: 10,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#1E3A5F',
    paddingBottom: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#1E3A5F' },
  headerSub: { fontSize: 9, color: '#6B7280', marginTop: 2 },
  reportId: { fontSize: 9, color: '#9CA3AF', textAlign: 'right' },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 6,
  },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A5F',
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  metaCell: {
    width: '50%',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
  },
  metaLabel: { fontSize: 8, color: '#9CA3AF', marginBottom: 2 },
  metaValue: { fontSize: 10, color: '#111827' },
  bodyText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: '#9CA3AF' },
});

// ── Severity / Status colours ─────────────────────────────────────────────────

const SEVERITY_BG: Record<string, string> = {
  low: '#D1FAE5',
  medium: '#FEF3C7',
  high: '#FFEDD5',
  critical: '#FEE2E2',
};
const SEVERITY_COLOR: Record<string, string> = {
  low: '#065F46',
  medium: '#92400E',
  high: '#9A3412',
  critical: '#991B1B',
};
const STATUS_BG: Record<string, string> = {
  submitted: '#DBEAFE',
  under_review: '#FEF3C7',
  resolved: '#D1FAE5',
  closed: '#F3F4F6',
  draft: '#F3F4F6',
};
const STATUS_COLOR: Record<string, string> = {
  submitted: '#1D4ED8',
  under_review: '#92400E',
  resolved: '#065F46',
  closed: '#4B5563',
  draft: '#6B7280',
};

// ── PDF Document component ────────────────────────────────────────────────────

function ReportPDF({ report }: { report: Awaited<ReturnType<typeof getReport>> }) {
  const generatedAt = new Date().toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Document title={`Incident Report — ${report.title}`} author="SiteWatch">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>SiteWatch</Text>
            <Text style={styles.headerSub}>Safety & Incident Reporting</Text>
          </View>
          <View>
            <Text style={styles.reportId}>Report ID: {report.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.reportId}>Generated: {generatedAt}</Text>
          </View>
        </View>

        {/* Title & badges */}
        <Text style={styles.title}>{report.title}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: SEVERITY_BG[report.severity] }]}>
            <Text style={{ color: SEVERITY_COLOR[report.severity] }}>
              {report.severity.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: STATUS_BG[report.status] }]}>
            <Text style={{ color: STATUS_COLOR[report.status] }}>
              {snakeToTitle(report.status).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Metadata grid */}
        <Text style={styles.sectionTitle}>Incident Details</Text>
        <View style={styles.metaGrid}>
          <MetaCell label="Incident Type" value={snakeToTitle(report.incident_type)} />
          <MetaCell label="Project / Site" value={report.project?.name ?? '—'} />
          <MetaCell label="Occurred At" value={formatDateTime(report.occurred_at)} />
          <MetaCell label="Reported At" value={formatDateTime(report.reported_at)} />
          <MetaCell
            label="Location on Site"
            value={report.location_description ?? '—'}
          />
          <MetaCell
            label="Submitted By"
            value={report.submitted_by_profile?.full_name ?? '—'}
          />
          {report.injured_person && (
            <MetaCell label="Injured Person" value={report.injured_person} />
          )}
          {report.witnesses && report.witnesses.length > 0 && (
            <MetaCell label="Witnesses" value={report.witnesses.join(', ')} />
          )}
        </View>

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.bodyText}>{report.description}</Text>

        {/* Resolution notes */}
        {report.resolution_notes && (
          <>
            <Text style={styles.sectionTitle}>Resolution Notes</Text>
            <Text style={styles.bodyText}>{report.resolution_notes}</Text>
            {report.reviewed_by_profile && (
              <Text style={[styles.footerText, { marginTop: 4 }]}>
                Reviewed by {report.reviewed_by_profile.full_name}
                {report.reviewed_at && ` — ${formatDateTime(report.reviewed_at)}`}
              </Text>
            )}
          </>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>SiteWatch — Confidential</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth check
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let report;
  try {
    report = await getReport(params.id);
  } catch {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // Verify the user has access (same company via RLS — getReport already checks)
  try {
    const pdfBuffer = await renderToBuffer(
      React.createElement(ReportPDF, { report })
    );

    const safeTitle = report.title.replace(/[^a-z0-9]/gi, '_').slice(0, 50);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="sitewatch_report_${safeTitle}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[PDF export error]', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
