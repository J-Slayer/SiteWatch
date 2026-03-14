/**
 * Profile screen — user info, role badge, and sign out.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';

const ROLE_LABELS: Record<string, string> = {
  worker: 'Field Worker',
  supervisor: 'Supervisor',
  company_admin: 'Company Admin',
  super_admin: 'Platform Admin',
};

const ROLE_ICONS: Record<string, string> = {
  worker: '🦺',
  supervisor: '📋',
  company_admin: '🏢',
  super_admin: '⚡',
};

export default function ProfileScreen() {
  const { profile, session, signOut } = useAuth();

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  const roleLabel = profile?.role ? ROLE_LABELS[profile.role] ?? profile.role : '—';
  const roleIcon = profile?.role ? ROLE_ICONS[profile.role] ?? '👤' : '👤';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Hero header */}
        <View style={styles.hero}>
          {/* Decorative glow */}
          <View style={styles.heroGlow} />

          <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
            <Text style={styles.name}>{profile?.full_name ?? '—'}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleIcon}>{roleIcon}</Text>
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Info section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.sectionCard}>
            <InfoRow icon="✉️" label="Email" value={session?.user?.email ?? '—'} />
            <InfoRow icon="📞" label="Phone" value={profile?.phone ?? 'Not set'} />
            <InfoRow icon="💼" label="Job Title" value={profile?.job_title ?? 'Not set'} />
          </View>
        </Animated.View>

        {/* App section */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.sectionCard}>
            <InfoRow icon="🔔" label="Notifications" value="Enabled" />
            <InfoRow icon="📱" label="Version" value="1.0.0" last />
          </View>
        </Animated.View>

        {/* Sign out */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)}>
          <TouchableOpacity style={styles.signOutButton} onPress={signOut} activeOpacity={0.8}>
            <Text style={styles.signOutIcon}>🚪</Text>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <View style={styles.infoLeft}>
        <View style={styles.infoIconBadge}>
          <Text style={styles.infoIcon}>{icon}</Text>
        </View>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F2F5' },
  container: {
    paddingBottom: Spacing['2xl'],
  },

  // Hero
  hero: {
    backgroundColor: Colors.primary[800],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF8C00',
    opacity: 0.15,
  },
  avatarWrap: { alignItems: 'center' },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,140,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,140,0,0.4)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleIcon: { fontSize: 13 },
  roleText: {
    fontSize: FontSize.sm,
    color: '#FFB84D',
    fontWeight: FontWeight.semibold,
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  infoIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: { fontSize: 15 },
  infoLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  infoValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    maxWidth: '50%',
    textAlign: 'right',
  },

  // Sign out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.base,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    backgroundColor: 'rgba(220,38,38,0.05)',
  },
  signOutIcon: { fontSize: 18 },
  signOutText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.danger,
  },
});
