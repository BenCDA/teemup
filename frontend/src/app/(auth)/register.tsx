import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator, Modal } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { Button, Input, AuthLayout, FaceVerificationCamera } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationImage, setVerificationImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const { register } = useAuth();

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
    if (!/[A-Z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une majuscule';
    if (!/[a-z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une minuscule';
    if (!/[0-9]/.test(pwd)) return 'Le mot de passe doit contenir au moins un chiffre';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Le mot de passe doit contenir au moins un caractère spécial';
    return null;
  };

  const handleCapture = (base64Image: string) => {
    setVerificationImage(base64Image);
    setShowCamera(false);
  };

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert('Mot de passe invalide', passwordError);
      return;
    }

    if (!verificationImage) {
      Alert.alert('Vérification requise', 'Veuillez prendre une photo pour vérifier votre identité');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Vérification de votre identité...');
    try {
      await register(email, password, firstName, lastName, verificationImage);
      setLoadingMessage('');
      router.replace('/(tabs)');
    } catch (error: any) {
      const errorMessage = error.response?.data?.errors?.password
        || error.response?.data?.message
        || 'Une erreur est survenue';
      Alert.alert('Erreur d\'inscription', errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <AuthLayout>
      <Text style={styles.title}>Inscription</Text>

      <View style={styles.loginPrompt}>
        <Text style={styles.loginText}>Déjà un compte ? Connectez-vous </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text style={styles.loginLink}>ici.</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.row}>
        <Input
          label="Prénom"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Jean"
          autoCapitalize="words"
          containerStyle={styles.halfInput}
        />

        <Input
          label="Nom"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Dupont"
          autoCapitalize="words"
          containerStyle={styles.halfInput}
        />
      </View>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="ex: jon.smith@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        placeholder="********"
        secureTextEntry
      />

      <Text style={styles.passwordHint}>
        Min. 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
      </Text>

      <Input
        label="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="********"
        secureTextEntry
      />

      {/* Face Verification Section */}
      <View style={styles.verificationSection}>
        <Text style={styles.verificationLabel}>Vérification d'identité</Text>
        <Text style={styles.verificationHint}>
          Prenez un selfie pour vérifier votre âge (18+ requis)
        </Text>

        {verificationImage ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: verificationImage }} style={styles.photoPreview} />
            <View style={styles.photoActions}>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text style={styles.verifiedText}>Photo prise</Text>
              </View>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => setShowCamera(true)}
              >
                <Ionicons name="refresh" size={18} color={theme.colors.primary} />
                <Text style={styles.retakeText}>Reprendre</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => setShowCamera(true)}
          >
            <Ionicons name="camera" size={32} color={theme.colors.primary} />
            <Text style={styles.cameraButtonText}>Prendre un selfie</Text>
          </TouchableOpacity>
        )}
      </View>

      <Button
        title="S'INSCRIRE"
        onPress={handleRegister}
        loading={isLoading}
        disabled={isLoading || !verificationImage}
        style={styles.registerButton}
      />

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Déjà un compte ?</Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Se connecter</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Face Verification Camera Modal */}
      <FaceVerificationCamera
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCapture}
        isVerifying={isVerifying}
      />

      {/* Loading Modal */}
      <Modal visible={isLoading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingTitle}>Inscription en cours</Text>
            <Text style={styles.loadingMessage}>{loadingMessage}</Text>
            <Text style={styles.loadingHint}>
              Cette opération peut prendre jusqu'à 30 secondes lors de la première vérification
            </Text>
          </View>
        </View>
      </Modal>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.bold,
    marginBottom: theme.spacing.sm,
    letterSpacing: theme.typography.letterSpacing.tight,
    color: theme.colors.text.primary,
  },
  loginPrompt: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  loginText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
  },
  loginLink: {
    fontSize: theme.typography.size.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.semibold,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  passwordHint: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    marginTop: -theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  verificationSection: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  verificationLabel: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  verificationHint: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.md,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${theme.colors.primary}15`,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  cameraButtonText: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.primary,
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  photoPreview: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
  },
  photoActions: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  verifiedText: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.success,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  retakeText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.primary,
  },
  registerButton: {
    marginTop: theme.spacing.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    color: theme.colors.text.tertiary,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.size.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  footerText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
  },
  footerLink: {
    color: theme.colors.primary,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xl,
    maxWidth: 300,
  },
  loadingTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  loadingMessage: {
    fontSize: theme.typography.size.md,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  loadingHint: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});
