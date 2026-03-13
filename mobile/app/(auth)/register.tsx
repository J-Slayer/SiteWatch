/**
 * Register screen.
 * Supports both creating a new company (company_admin) and
 * joining an existing one via invite token.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '@/services/auth.service';
import { useUIStore } from '@/store/ui.store';
import { registerSchema, type RegisterFormData } from '@/utils/validators';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

type AccountType = 'new_company' | 'join_with_invite';

export default function RegisterScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('new_company');
  const showToast = useUIStore((s) => s.showToast);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      invitationToken: '',
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    try {
      await authService.signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        companyName: accountType === 'new_company' ? data.companyName : undefined,
        invitationToken: accountType === 'join_with_invite' ? data.invitationToken : undefined,
      });
      showToast('Account created! Please check your email to confirm.', 'success');
      router.replace('/(auth)/login');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Registration failed. Please try again.';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🦺</Text>
          <Text style={styles.title}>SiteWatch</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        {/* Account type selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, accountType === 'new_company' && styles.typeButtonActive]}
            onPress={() => setAccountType('new_company')}
          >
            <Text style={[styles.typeText, accountType === 'new_company' && styles.typeTextActive]}>
              New Company
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, accountType === 'join_with_invite' && styles.typeButtonActive]}
            onPress={() => setAccountType('join_with_invite')}
          >
            <Text
              style={[styles.typeText, accountType === 'join_with_invite' && styles.typeTextActive]}
            >
              Join with Invite
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="Jane Smith"
                autoComplete="name"
                returnKeyType="next"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.fullName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Work Email"
                placeholder="jane@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.email?.message}
              />
            )}
          />

          {accountType === 'new_company' && (
            <Controller
              control={control}
              name="companyName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Company / Organization Name"
                  placeholder="Acme Construction Ltd."
                  returnKeyType="next"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.companyName?.message}
                />
              )}
            />
          )}

          {accountType === 'join_with_invite' && (
            <Controller
              control={control}
              name="invitationToken"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Invitation Code"
                  placeholder="Paste invite code from your email"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.invitationToken?.message}
                />
              )}
            />
          )}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Min. 8 characters"
                isPassword
                returnKeyType="next"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="••••••••"
                isPassword
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            label="Create Account"
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            fullWidth
            size="lg"
            style={styles.submitButton}
          />
        </View>

        {/* Login link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.primary[600],
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: { fontSize: 44, marginBottom: Spacing.sm },
  title: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.primary[200],
    marginTop: Spacing.xs,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[700],
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.base,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.white,
  },
  typeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.primary[200],
  },
  typeTextActive: {
    color: Colors.primary[600],
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.xl,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: { color: Colors.primary[200], fontSize: FontSize.sm },
  footerLink: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
