import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '@/features/shared/styles/ThemeContext';
import { Theme } from '@/features/shared/styles/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

/**
 * Reusable Input Component
 *
 * Supports labels, error messages, and all standard TextInput props
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...textInputProps
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={theme.colors.input.placeholder}
        accessibilityLabel={label || textInputProps.placeholder}
        accessibilityState={{ disabled: textInputProps.editable === false }}
        {...textInputProps}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text.primary,
  },
  input: {
    backgroundColor: theme.colors.input.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: theme.typography.size.md,
    borderWidth: 1,
    borderColor: 'transparent',
    color: theme.colors.text.primary,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.size.sm,
    marginTop: theme.spacing.xs,
  },
});
