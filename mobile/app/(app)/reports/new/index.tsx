/**
 * New incident report — 3-step form.
 *   Step 1: Details  (project, title, type, severity, description, location)
 *   Step 2: Photos   (camera or library; up to 5 photos)
 *   Step 3: Review   (summary of all fields + photo count before submit)
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
  Alert,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ImagePickerAsset } from 'expo-image-picker';

import { incidentReportSchema, type IncidentReportFormData } from '@/utils/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PhotoAnnotator } from '@/components/annotation/PhotoAnnotator';
import type { PhotoAnnotation } from '@sitewatch/types';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useSubmitReport } from '@/hooks/useReports';
import { useAccessibleProjects } from '@/hooks/useProjects';
import { useAuthStore } from '@/store/auth.store';
import { useConnectivity } from '@/hooks/useConnectivity';
import { photoService } from '@/services/photo.service';
import type { IncidentType, IncidentSeverity } from '@sitewatch/types';

// ── Constants ──────────────────────────────────────────────────────────────────

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

const MAX_PHOTOS = 5;

const INCIDENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  INCIDENT_TYPES.map((t) => [t.value, `${t.icon} ${t.label}`])
);

const SEVERITY_LABELS: Record<string, string> = Object.fromEntries(
  SEVERITY_LEVELS.map((s) => [s.value, s.label])
);

// ── Main Component ─────────────────────────────────────────────────────────────

export default function NewReportScreen() {
  const { mutateAsync: submitReport, isPending } = useSubmitReport();
  const { data: projects = [] } = useAccessibleProjects();
  const profile = useAuthStore((s) => s.profile);
  const { isOnline } = useConnectivity();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [photoAssets, setPhotoAssets] = useState<ImagePickerAsset[]>([]);
  const [photoAnnotations, setPhotoAnnotations] = useState<Record<number, PhotoAnnotation[]>>({});
  const [annotatingIndex, setAnnotatingIndex] = useState<number | null>(null);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<IncidentReportFormData>({
    resolver: zodResolver(incidentReportSchema),
    defaultValues: {
      title: '',
      description: '',
      incidentType: undefined,
      severity: undefined,
      occurredAt: new Date(),
      projectId: projects[0]?.id,
    },
  });

  const selectedType = watch('incidentType');
  const selectedSeverity = watch('severity');
  const selectedProjectId = watch('projectId');

  // ── Photo helpers ────────────────────────────────────────────────────────────

  async function addPhotoFromCamera() {
    if (photoAssets.length >= MAX_PHOTOS) return;
    setIsAddingPhoto(true);
    try {
      const asset = await photoService.takePhoto();
      if (asset) setPhotoAssets((prev) => [...prev, asset]);
    } catch (err: any) {
      Alert.alert('Camera Error', err?.message ?? 'Could not access the camera.');
    } finally {
      setIsAddingPhoto(false);
    }
  }

  async function addPhotoFromLibrary() {
    if (photoAssets.length >= MAX_PHOTOS) return;
    setIsAddingPhoto(true);
    try {
      const asset = await photoService.pickPhoto();
      if (asset) setPhotoAssets((prev) => [...prev, asset]);
    } catch (err: any) {
      Alert.alert('Photo Library Error', err?.message ?? 'Could not access photos.');
    } finally {
      setIsAddingPhoto(false);
    }
  }

  function removePhoto(index: number) {
    setPhotoAssets((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  function goBack() {
    if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  }

  // Step 1 → 2: validate required fields first
  async function handleStep1Next() {
    // Trigger validation on required fields
    const values = getValues();
    const hasProject = !!values.projectId;
    const hasTitle = (values.title ?? '').trim().length >= 3;
    const hasType = !!values.incidentType;
    const hasSeverity = !!values.severity;
    const hasDescription = (values.description ?? '').trim().length >= 10;

    if (!hasProject || !hasTitle || !hasType || !hasSeverity || !hasDescription) {
      // Use handleSubmit to trigger error display on the form
      handleSubmit(() => {})();
      return;
    }
    setCurrentStep(2);
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function onSubmit(data: IncidentReportFormData) {
    if (!profile?.company_id) {
      Alert.alert('Error', 'Your account is not linked to a company.');
      return;
    }

    try {
      await submitReport({
        payload: {
          company_id: profile.company_id,
          project_id: data.projectId,
          submitted_by: profile.id,
          title: data.title,
          description: data.description,
          incident_type: data.incidentType,
          severity: data.severity,
          occurred_at: data.occurredAt.toISOString(),
          reported_at: new Date().toISOString(),
          location_description: data.locationDescription ?? null,
          injured_person: data.injuredPerson ?? null,
          witnesses: data.witnesses ?? null,
          status: 'submitted',
          client_id: `${profile.id}-${Date.now()}`,
        },
        photoUris: photoAssets.map((a) => a.uri),
      });

      Alert.alert(
        isOnline ? 'Report Submitted' : 'Saved Offline',
        isOnline
          ? 'Your incident report has been submitted successfully.'
          : 'No internet. Your report is saved and will sync when you reconnect.',
        [{ text: 'OK', onPress: () => router.replace('/(app)/reports') }]
      );
    } catch (err: any) {
      Alert.alert('Submission Failed', err?.message ?? 'Please try again.');
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Nav bar */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.navBack}>{currentStep === 1 ? '✕ Cancel' : '‹ Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>New Incident Report</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <StepDot step={1} label="Details" state={currentStep > 1 ? 'done' : currentStep === 1 ? 'active' : 'idle'} />
          <View style={[styles.stepLine, currentStep > 1 && styles.stepLineDone]} />
          <StepDot step={2} label="Photos" state={currentStep > 2 ? 'done' : currentStep === 2 ? 'active' : 'idle'} />
          <View style={[styles.stepLine, currentStep > 2 && styles.stepLineDone]} />
          <StepDot step={3} label="Review" state={currentStep === 3 ? 'active' : 'idle'} />
        </View>

        {/* ── Step 1: Details ────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Project picker */}
            <Text style={styles.fieldLabel}>Project / Site *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipRow}
              contentContainerStyle={{ paddingRight: Spacing.base }}
            >
              {projects.length === 0 ? (
                <Text style={styles.noProjectText}>No active projects assigned to you.</Text>
              ) : (
                projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.chip,
                      selectedProjectId === project.id && styles.chipSelected,
                    ]}
                    onPress={() => setValue('projectId', project.id)}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        selectedProjectId === project.id && styles.chipLabelSelected,
                      ]}
                    >
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            {errors.projectId && <Text style={styles.errorText}>{errors.projectId.message}</Text>}

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

            {/* Incident type */}
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
                    { borderColor: level.color },
                    selectedSeverity === level.value && {
                      backgroundColor: level.color,
                    },
                  ]}
                  onPress={() => setValue('severity', level.value)}
                >
                  <Text
                    style={[
                      styles.severityLabel,
                      { color: level.color },
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
              onPress={handleStep1Next}
              fullWidth
              size="lg"
              style={styles.nextButton}
            />
          </ScrollView>
        )}

        {/* ── Step 2: Photos ─────────────────────────────────────────────── */}
        {currentStep === 2 && (
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.stepHeading}>Add Photos</Text>
            <Text style={styles.stepSubheading}>
              Attach up to {MAX_PHOTOS} photos of the incident scene. This step is optional.
            </Text>

            {/* Photo grid */}
            {photoAssets.length > 0 && (
              <View style={styles.photoGrid}>
                {photoAssets.map((asset, index) => (
                  <View key={index} style={styles.photoThumbWrapper}>
                    <Image source={{ uri: asset.uri }} style={styles.photoThumb} />

                    {/* Annotate button */}
                    <TouchableOpacity
                      style={styles.photoAnnotateBtn}
                      onPress={() => setAnnotatingIndex(index)}
                    >
                      <Text style={styles.photoAnnotateText}>✏️</Text>
                    </TouchableOpacity>

                    {/* Annotation count badge */}
                    {(photoAnnotations[index]?.length ?? 0) > 0 && (
                      <View style={styles.annotationBadge}>
                        <Text style={styles.annotationBadgeText}>
                          {photoAnnotations[index].length}
                        </Text>
                      </View>
                    )}

                    {/* Remove button */}
                    <TouchableOpacity
                      style={styles.photoRemoveBtn}
                      onPress={() => removePhoto(index)}
                    >
                      <Text style={styles.photoRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Annotator modal */}
            {annotatingIndex !== null && (
              <PhotoAnnotator
                photoUri={photoAssets[annotatingIndex].uri}
                initialAnnotations={photoAnnotations[annotatingIndex] ?? []}
                onSave={(annotations) => {
                  setPhotoAnnotations((prev) => ({ ...prev, [annotatingIndex]: annotations }));
                  setAnnotatingIndex(null);
                }}
                onClose={() => setAnnotatingIndex(null)}
              />
            )}

            {/* Add photo buttons */}
            {photoAssets.length < MAX_PHOTOS && (
              <View style={styles.addPhotoRow}>
                <TouchableOpacity
                  style={[styles.addPhotoBtn, isAddingPhoto && styles.addPhotoBtnDisabled]}
                  onPress={addPhotoFromCamera}
                  disabled={isAddingPhoto}
                >
                  {isAddingPhoto ? (
                    <ActivityIndicator size="small" color={Colors.primary[600]} />
                  ) : (
                    <>
                      <Text style={styles.addPhotoIcon}>📷</Text>
                      <Text style={styles.addPhotoLabel}>Camera</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.addPhotoBtn, isAddingPhoto && styles.addPhotoBtnDisabled]}
                  onPress={addPhotoFromLibrary}
                  disabled={isAddingPhoto}
                >
                  {isAddingPhoto ? (
                    <ActivityIndicator size="small" color={Colors.primary[600]} />
                  ) : (
                    <>
                      <Text style={styles.addPhotoIcon}>🖼️</Text>
                      <Text style={styles.addPhotoLabel}>Library</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {photoAssets.length >= MAX_PHOTOS && (
              <Text style={styles.photoLimitText}>
                Maximum of {MAX_PHOTOS} photos reached.
              </Text>
            )}

            {photoAssets.length === 0 && (
              <Card style={styles.noPhotoCard}>
                <Text style={styles.noPhotoIcon}>📸</Text>
                <Text style={styles.noPhotoText}>No photos added yet</Text>
                <Text style={styles.noPhotoSubtext}>
                  Photos help investigators understand what happened.
                </Text>
              </Card>
            )}

            <View style={styles.stepNavRow}>
              <Button
                label="Review Report →"
                onPress={() => setCurrentStep(3)}
                fullWidth
                size="lg"
                style={{ marginBottom: 0 }}
              />
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={() => setCurrentStep(3)}
              >
                <Text style={styles.skipBtnText}>Skip photos</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ── Step 3: Review ─────────────────────────────────────────────── */}
        {currentStep === 3 && (
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.stepHeading}>Review & Submit</Text>
            <Text style={styles.stepSubheading}>
              Check the details below before submitting your report.
            </Text>

            <Card style={styles.reviewCard}>
              <ReviewRow label="Project" value={selectedProject?.name ?? '—'} />
              <ReviewRow label="Title" value={getValues('title')} />
              <ReviewRow
                label="Type"
                value={INCIDENT_TYPE_LABELS[getValues('incidentType') ?? ''] ?? '—'}
              />
              <ReviewRow
                label="Severity"
                value={SEVERITY_LABELS[getValues('severity') ?? ''] ?? '—'}
                valueColor={
                  SEVERITY_LEVELS.find((s) => s.value === getValues('severity'))?.color
                }
              />
              <ReviewRow label="Description" value={getValues('description')} multiline />
              {getValues('locationDescription') ? (
                <ReviewRow label="Location" value={getValues('locationDescription')!} />
              ) : null}
              {getValues('injuredPerson') ? (
                <ReviewRow label="Injured Person" value={getValues('injuredPerson')!} />
              ) : null}
              <ReviewRow
                label="Photos"
                value={
                  photoAssets.length === 0
                    ? 'None attached'
                    : `${photoAssets.length} photo${photoAssets.length > 1 ? 's' : ''} attached`
                }
              />
            </Card>

            {/* Photo previews in review */}
            {photoAssets.length > 0 && (
              <View style={styles.reviewPhotoRow}>
                {photoAssets.map((asset, i) => (
                  <Image key={i} source={{ uri: asset.uri }} style={styles.reviewPhotoThumb} />
                ))}
              </View>
            )}

            {!isOnline && (
              <View style={styles.offlineNote}>
                <Text style={styles.offlineNoteText}>
                  📵 You are offline. This report will be saved locally and synced when you reconnect.
                </Text>
              </View>
            )}

            <Button
              label={isPending ? 'Submitting…' : isOnline ? 'Submit Report' : 'Save Offline'}
              onPress={handleSubmit(onSubmit)}
              fullWidth
              size="lg"
              isLoading={isPending}
              style={styles.nextButton}
            />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

type StepState = 'idle' | 'active' | 'done';

function StepDot({ step, label, state }: { step: number; label: string; state: StepState }) {
  return (
    <View style={stepStyles.wrapper}>
      <View
        style={[
          stepStyles.dot,
          state === 'active' && stepStyles.dotActive,
          state === 'done' && stepStyles.dotDone,
        ]}
      >
        {state === 'done' ? (
          <Text style={stepStyles.doneText}>✓</Text>
        ) : (
          <Text style={[stepStyles.number, state === 'active' && stepStyles.numberActive]}>
            {step}
          </Text>
        )}
      </View>
      <Text
        style={[
          stepStyles.label,
          state === 'active' && stepStyles.labelActive,
          state === 'done' && stepStyles.labelDone,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 4 },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: '#FF8C00' },
  dotDone: { backgroundColor: '#FF8C0033', borderWidth: 1.5, borderColor: '#FF8C00' },
  number: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.gray[400] },
  numberActive: { color: Colors.white },
  doneText: { fontSize: 14, color: '#FF8C00', fontWeight: FontWeight.bold },
  label: { fontSize: 10, color: Colors.gray[400] },
  labelActive: { color: '#FF8C00', fontWeight: FontWeight.semibold },
  labelDone: { color: '#FF8C00' },
});

function ReviewRow({
  label,
  value,
  multiline = false,
  valueColor,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={[reviewStyles.row, multiline && reviewStyles.rowMultiline]}>
      <Text style={reviewStyles.label}>{label}</Text>
      <Text
        style={[
          reviewStyles.value,
          multiline && reviewStyles.valueMultiline,
          valueColor ? { color: valueColor, fontWeight: FontWeight.semibold } : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  rowMultiline: { alignItems: 'flex-start' },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    flexShrink: 0,
    minWidth: 90,
  },
  value: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
  valueMultiline: {
    textAlign: 'left',
    lineHeight: 20,
  },
});

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F2F5' },
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
    color: '#FF8C00',
    fontWeight: FontWeight.medium,
    width: 70,
  },
  navTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    maxWidth: 40,
    marginHorizontal: Spacing.xs,
  },
  stepLineDone: { backgroundColor: '#FF8C00' },

  container: {
    padding: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },

  stepHeading: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepSubheading: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },

  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  chipRow: { marginBottom: Spacing.base },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginRight: Spacing.sm,
  },
  chipSelected: {
    borderColor: '#FF8C00',
    backgroundColor: '#FF8C00',
  },
  chipLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  chipLabelSelected: { color: Colors.white },
  noProjectText: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    fontWeight: FontWeight.medium,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    overflow: 'hidden',
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
    borderColor: '#FF8C00',
    backgroundColor: '#FFF5EC',
  },
  typeChipIcon: { fontSize: 16 },
  typeChipLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  typeChipLabelSelected: { color: '#FF8C00', fontWeight: FontWeight.semibold },

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

  nextButton: { marginTop: Spacing.xl },

  // Photos step
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  photoThumbWrapper: { position: 'relative' },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: Colors.gray[200],
  },
  photoAnnotateBtn: {
    position: 'absolute',
    bottom: -8,
    left: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAnnotateText: { fontSize: 14 },
  annotationBadge: {
    position: 'absolute',
    bottom: -8,
    right: 16,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  annotationBadgeText: { color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold },
  photoRemoveBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: { color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold },

  addPhotoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  addPhotoBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary[300],
    borderStyle: 'dashed',
    backgroundColor: Colors.primary[50],
    gap: Spacing.sm,
  },
  addPhotoBtnDisabled: { opacity: 0.5 },
  addPhotoIcon: { fontSize: 32 },
  addPhotoLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary[600],
  },
  photoLimitText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  noPhotoCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  noPhotoIcon: { fontSize: 40 },
  noPhotoText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  noPhotoSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  stepNavRow: {
    gap: Spacing.md,
    marginTop: Spacing.base,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  // Review step
  reviewCard: { marginBottom: Spacing.base },
  reviewPhotoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginBottom: Spacing.base,
  },
  reviewPhotoThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: Colors.gray[200],
  },
  offlineNote: {
    backgroundColor: Colors.accent[50],
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.accent[100],
  },
  offlineNoteText: {
    fontSize: FontSize.sm,
    color: Colors.accent[500],
    lineHeight: 20,
  },
});
