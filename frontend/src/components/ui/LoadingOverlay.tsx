import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '@/features/shared/styles/theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  subMessage?: string;
}

/**
 * Loading Overlay Component
 *
 * Full-screen overlay with blur effect for long-running operations
 * Used for face verification, uploads, etc.
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Chargement...',
  subMessage,
}) => {
  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <BlurView intensity={20} style={styles.overlay} tint="dark">
        <View style={styles.content}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
          <Text style={styles.message}>{message}</Text>
          {subMessage && (
            <Text style={styles.subMessage}>{subMessage}</Text>
          )}
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    minWidth: 200,
    maxWidth: 300,
    ...theme.shadows.lg,
  },
  loaderContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subMessage: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
