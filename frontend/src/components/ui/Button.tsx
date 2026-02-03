import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  AccessibilityState,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/features/shared/styles/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityHint?: string;
}

/**
 * Reusable Button Component
 *
 * Supports loading state, disabled state, multiple variants, and accessibility
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  accessibilityHint,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.button,
    styles[`button${capitalize(variant)}` as keyof typeof styles],
    styles[`button${capitalize(size)}` as keyof typeof styles],
    fullWidth && styles.buttonFullWidth,
    isDisabled && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    styles[`text${capitalize(variant)}` as keyof typeof styles],
    styles[`text${capitalize(size)}` as keyof typeof styles],
    textStyle,
  ];

  const getSpinnerColor = () => {
    switch (variant) {
      case 'outline':
        return theme.colors.primary;
      case 'danger':
        return 'white';
      case 'success':
        return 'white';
      default:
        return 'white';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'outline':
        return theme.colors.primary;
      default:
        return 'white';
    }
  };

  const handlePress = () => {
    if (!isDisabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const accessibilityState: AccessibilityState = {
    disabled: isDisabled,
    busy: loading,
  };

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
    >
      {loading ? (
        <ActivityIndicator color={getSpinnerColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={getIconColor()}
              style={styles.iconLeft}
            />
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={getIconColor()}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.sm,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 50,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.text.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  buttonDanger: {
    backgroundColor: theme.colors.error,
  },
  buttonSuccess: {
    backgroundColor: theme.colors.success,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonSm: {
    padding: 10,
    minHeight: 40,
  },
  buttonMd: {
    padding: 15,
    minHeight: 50,
  },
  buttonLg: {
    padding: 18,
    minHeight: 56,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
  },
  textPrimary: {
    color: 'white',
  },
  textSecondary: {
    color: 'white',
  },
  textOutline: {
    color: theme.colors.primary,
  },
  textDanger: {
    color: 'white',
  },
  textSuccess: {
    color: 'white',
  },
  textSm: {
    fontSize: theme.typography.size.sm,
  },
  textMd: {
    fontSize: theme.typography.size.lg,
  },
  textLg: {
    fontSize: theme.typography.size.xl,
  },
  iconLeft: {
    marginRight: theme.spacing.sm,
  },
  iconRight: {
    marginLeft: theme.spacing.sm,
  },
});
