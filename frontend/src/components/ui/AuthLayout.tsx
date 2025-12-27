import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/features/shared/styles/theme';
import { AuthHeader } from './AuthHeader';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Composant de mise en page d'authentification
 *
 * Fournit une mise en page cohérente avec en-tête fixe pour les écrans de connexion et d'inscription
 * L'en-tête reste en place tandis que le contenu s'anime
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* En-tête fixe - ne s'anime pas */}
      <AuthHeader />

      {/* Zone de contenu animée */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.contentContainer}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    padding: theme.layout.screenPadding,
  },
});
