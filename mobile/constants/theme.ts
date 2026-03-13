/**
 * SiteWatch design system tokens.
 * All colors, spacing, typography, and border radii live here.
 */

export const Colors = {
  // Primary brand — deep navy
  primary: {
    50: '#EEF2F7',
    100: '#D4E0EE',
    200: '#A9C1DD',
    300: '#7EA2CC',
    400: '#5383BB',
    500: '#2864AA',
    600: '#1E3A5F', // main brand color
    700: '#162C48',
    800: '#0F1E30',
    900: '#070F18',
  },
  // Accent — safety orange
  accent: {
    50: '#FFF5EC',
    100: '#FFE4C9',
    400: '#FF8C00',
    500: '#E67300',
    600: '#CC6600',
  },
  // Semantic
  danger: '#DC2626',
  warning: '#D97706',
  success: '#16A34A',
  info: '#2563EB',
  // Severity colors
  severity: {
    low: '#16A34A',
    medium: '#D97706',
    high: '#EA580C',
    critical: '#DC2626',
  },
  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  background: '#F5F7FA',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};
