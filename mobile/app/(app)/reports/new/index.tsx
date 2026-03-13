/**
 * New incident report — Step 1: Report details.
 * Multi-step form wired up fully in Phase 3.
 * This screen contains the full form skeleton with navigation.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { incidentReportSchema, type IncidentReportFormData } from '@/utils/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import type { IncidentType, IncidentSeverity } from '@sitewatch/types';

const INCIDENT_TYPES: { value: IncidentType; label: string; icon: string }[] = [
  { value: 'near_miss', label: 'Near Miss', icon: '⚠️' },
  { value: 'injury', label: 'Injury', icon: '🤕' },
  { value: 'property_damage', label: 'Property Damage', icon: '🏗️' },
  { value: 'environmental', label: 'Environmental', icon: '🌿' },
  { value: 'security', label: 'Security', icon: '🔒' },
  { value: 'fire', label: 'Fire', icon: '🔥' },
  { value: 'other', label: 'Other', icon: '📝' },
];

const SEVERITY_LEVELS: { value: IncidentSeverity; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#16A34A' },
  { value: 'medium', label: 'Medium', color: '#D97706' },
  { value: 'high', label: 'High', color: '#EA580C' },
  { value: 'critical', label: 'Critical', color: '#DC2626' },
];

export default function NewReportScreen() {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IncidentReportFormData>({
    resolver: zodResolver(incidentReportSchema),
    defaultValues: {
      title: '',
      description: '',
      incidentType: undefined,
      severity: undefined,
      occurredAt: new Date(),
    },
  });

  const selectedType = watch('incidentType');
  const selectedSeverity = watch('severity');

  function onSubmit(data: IncidentReportFormData) {
    // Phase 3: submit to Supabase / offline queue
    console.log('Report data:', data);
    router.push('/(app)/reports');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Nav bar */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.navBack}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>New Incident Report</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step indicator */}
          <View style={styles.stepRow}>
            <StepDot step={1} label="Details" active />
            <View style={styles.stepLine} />
            <StepDot step={2} label="Photos" active={false} />
            <View style={styles.stepLine} />
            <StepDot step={3} label="Review" active={false} />
          </View>

          {/* Title */}
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Incident Title *"
                placeholder="Brief description of what happened"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.title?.message}
                returnKeyType="next"
              />
            )}
          />

          {/* Incident type selector */}
          <Text style={styles.fieldLabel}>Incident Type *</Text>
          <View style={styles.typeGrid}>
            {INCIDENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeChip,
                  selectedType === type.value && styles.typeChipSelected,
                ]}
                onPress={() => setValue('incidentType', type.value)}
              >
                <Text style={styles.typeChipIcon}>{type.icon}</Text>
                <Text
                  style={[
                    styles.typeChipLabel,
                    selectedType === type.value && styles.typeChipLabelSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.incidentType && (
            <Text style={styles.errorText}>{errors.incidentType.message}</Text>
          )}

          {/* Severity */}
          <Text style={styles.fieldLabel}>Severity *</Text>
          <View style={styles.severityRow}>
            {SEVERITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.severityChip,
                  selectedSeverity === level.value && {
                    backgroundColor: level.color,
                    borderColor: level.color,
                  },
                ]}
                onPress={() => setValue('severity', level.value)}
              >
                <Text
                  style={[
                    styles.severityLabel,
                    selectedSeverity === level.value && styles.severityLabelSelected,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.severity && (
            <Text style={styles.errorText}>{errors.severity.message}</Text>
          )}

          {/* Description */}
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="What happened? *"
                placeholder="Describe the incident in detail — what, where, and how it occurred..."
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={{ minHeight: 120, paddingTop: Spacing.sm }}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.description?.message}
              />
            )}
          />

          {/* Location */}
          <Controller
            control={control}
            name="locationDescription"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Location on Site"
                placeholder="e.g. Level 3 – East stairwell"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ''}
                error={errors.locationDescription?.message}
              />
            )}
          />

          {/* Injured person */}
          <Controller
            control={control}
            name="injuredPerson"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Injured Person (if any)"
                placeholder="Full name"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ''}
              />
            )}
          />

          <Button
            label="Next: Add Photos →"
            onPress={handleSubmit(onSubmit)}
            fullWidth
            size="lg"
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepDot({ step, label, active }: { step: number; label: string; active: boolean }) {
  return (
    <View style={styles.stepDotWrapper}>
      <View style={[styles.stepDot, active && styles.stepDotActive]}>
        <Text style={[styles.stepDotText, active && styles.stepDotTextActive]}>
          {step}
        </Text>
      </View>
      <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
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
  container: {
    padding: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.base,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    maxWidth: 40,
    marginHorizontal: Spacing.xs,
  },
  stepDotWrapper: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: Colors.primary[600] },
  stepDotText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.gray[400],
  },
  stepDotTextActive: { color: Colors.white },
  stepLabel: { fontSize: 10, color: Colors.gray[400] },
  stepLabelActive: { color: Colors.primary[600], fontWeight: FontWeight.semibold },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  typeChipSelected: {
    borderColor: Colors.primary[600],
    backgroundColor: Colors.primary[50],
  },
  typeChipIcon: { fontSize: 16 },
  typeChipLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  typeChipLabelSelected: { color: Colors.primary[600] },
  severityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  severityChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  severityLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  severityLabelSelected: { color: Colors.white },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
  },
  submitButton: { marginTop: Spacing.lg },
});
