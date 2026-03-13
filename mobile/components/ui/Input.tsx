import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Colors, BorderRadius, FontSize, Spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  /** Show a password toggle icon */
  isPassword?: boolean;
  /** Icon component rendered on the left */
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, hint, isPassword, leftIcon, style, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const hasError = !!error;

    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}

        <View style={[styles.inputWrapper, hasError && styles.inputWrapperError]}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            style={[styles.input, leftIcon && styles.inputWithLeft, style]}
            secureTextEntry={isPassword && !isVisible}
            placeholderTextColor={Colors.textDisabled}
            autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
            autoCorrect={isPassword ? false : props.autoCorrect}
            {...props}
          />

          {isPassword && (
            <TouchableOpacity
              onPress={() => setIsVisible((v) => !v)}
              style={styles.eyeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.eyeText}>{isVisible ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {hasError && <Text style={styles.error}>{error}</Text>}
        {hint && !hasError && <Text style={styles.hint}>{hint}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    minHeight: 48,
  },
  inputWrapperError: {
    borderColor: Colors.danger,
  },
  leftIcon: {
    paddingLeft: Spacing.md,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  inputWithLeft: {
    paddingLeft: Spacing.sm,
  },
  eyeButton: {
    paddingHorizontal: Spacing.md,
  },
  eyeText: {
    fontSize: FontSize.sm,
    color: Colors.primary[600],
    fontWeight: '500',
  },
  error: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
