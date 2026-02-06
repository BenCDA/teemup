import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator, Animated } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/features/auth/AuthContext';
import { authService } from '@/features/auth/authService';
import { Button, Input, AuthLayout, FaceVerificationCamera, LoadingOverlay, useToast } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';
import { FaceVerificationResponse, AxiosApiError } from '@/types';

const PRO_BENEFITS = [
  { icon: 'cash-outline' as const, text: 'Créer des événements payants' },
  { icon: 'trophy-outline' as const, text: 'Badge Pro sur votre profil' },
  { icon: 'stats-chart-outline' as const, text: 'Statistiques avancées' },
  { icon: 'star-outline' as const, text: 'Priorité dans les recherches' },
];

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationImage, setVerificationImage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<FaceVerificationResponse | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const { register } = useAuth();
  const toast = useToast();

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
    if (!/[A-Z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une majuscule';
    if (!/[a-z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une minuscule';
    if (!/[0-9]/.test(pwd)) return 'Le mot de passe doit contenir au moins un chiffre';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Le mot de passe doit contenir au moins un caractère spécial';
    return null;
  };

  const handleCapture = async (base64Image: string) => {
    setShowCamera(false);
    setVerificationImage(base64Image);
    setIsVerifying(true);

    try {
      // Call the verification endpoint to check age
      const result = await authService.verifyFace(base64Image);
      setVerificationResult(result);

      if (!result.faceDetected) {
        Alert.alert(
          'Visage non détecté',
          'Aucun visage n\'a été détecté sur la photo. Veuillez reprendre la photo.',
          [{ text: 'Reprendre', onPress: () => setShowCamera(true) }]
        );
        setVerificationImage(null);
      } else if (!result.isAdult) {
        Alert.alert(
          'Inscription refusée',
          `Âge détecté : ${result.age} ans.\n\nVous devez avoir 18 ans ou plus pour vous inscrire sur TeemUp.`,
          [{ text: 'Compris' }]
        );
        setVerificationImage(null);
        setVerificationResult(null);
      }
    } catch {
      Alert.alert('Erreur', 'Erreur lors de la vérification. Veuillez réessayer.');
      setVerificationImage(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      toast.show({ message: 'Veuillez remplir tous les champs', type: 'warning' });
      return;
    }

    if (password !== confirmPassword) {
      toast.show({ message: 'Les mots de passe ne correspondent pas', type: 'error' });
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.show({ message: passwordError, type: 'error', duration: 4000 });
      return;
    }

    if (!verificationImage || !verificationResult?.isAdult) {
      toast.show({
        message: 'Veuillez prendre une photo pour vérifier votre identité',
        type: 'warning',
        action: { label: 'Vérifier', onPress: () => setShowCamera(true) },
      });
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, firstName, lastName, verificationImage, isPro);
      toast.show({ message: 'Compte créé avec succès !', type: 'success' });
      router.replace('/onboarding');
    } catch (error) {
      const axiosError = error as AxiosApiError;
      const errorCode = axiosError.response?.data?.code;
      const errorMessage = axiosError.response?.data?.message || 'Une erreur est survenue';

      // Handle specific error codes
      if (errorCode === 'EMAIL_EXISTS') {
        Alert.alert(
          'Email déjà utilisé',
          'Un compte existe déjà avec cet email. Souhaitez-vous vous connecter ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Se connecter', onPress: () => router.push('/(auth)/login') },
          ]
        );
      } else if (errorCode === 'FACE_VERIFICATION_FAILED') {
        Alert.alert('Vérification échouée', errorMessage, [
          { text: 'Réessayer', onPress: () => setShowCamera(true) },
        ]);
        setVerificationImage(null);
        setVerificationResult(null);
      } else {
        Alert.alert('Erreur d\'inscription', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const canRegister = verificationImage && verificationResult?.isAdult;

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

      {/* Pro Account Section */}
      <View style={styles.proSection}>
        <Text style={styles.proSectionTitle}>Type de compte</Text>

        {/* Free Account Option */}
        <TouchableOpacity
          style={[styles.accountOption, !isPro && styles.accountOptionSelected]}
          onPress={() => setIsPro(false)}
          activeOpacity={0.7}
        >
          <View style={styles.accountOptionHeader}>
            <View style={[styles.radioCircle, !isPro && styles.radioCircleSelected]}>
              {!isPro && <View style={styles.radioInner} />}
            </View>
            <View style={styles.accountOptionInfo}>
              <Text style={styles.accountOptionTitle}>Gratuit</Text>
              <Text style={styles.accountOptionPrice}>0€</Text>
            </View>
          </View>
          <Text style={styles.accountOptionDesc}>
            Rejoignez des événements et connectez-vous avec d'autres sportifs
          </Text>
        </TouchableOpacity>

        {/* Pro Account Option */}
        <TouchableOpacity
          style={[styles.accountOption, styles.proOption, isPro && styles.accountOptionSelected, isPro && styles.proOptionSelected]}
          onPress={() => setIsPro(true)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={isPro ? ['#FFD700', '#FFA500'] : ['transparent', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.proBadgeGradient}
          >
            <Ionicons name="star" size={12} color={isPro ? '#fff' : '#FFD700'} />
            <Text style={[styles.proBadgeText, isPro && styles.proBadgeTextSelected]}>PRO</Text>
          </LinearGradient>

          <View style={styles.accountOptionHeader}>
            <View style={[styles.radioCircle, isPro && styles.radioCircleSelectedPro]}>
              {isPro && <View style={[styles.radioInner, styles.radioInnerPro]} />}
            </View>
            <View style={styles.accountOptionInfo}>
              <Text style={styles.accountOptionTitle}>Professionnel</Text>
              <View style={styles.proPriceRow}>
                <Text style={styles.proPrice}>9,99€</Text>
                <Text style={styles.proPricePeriod}>/mois</Text>
              </View>
            </View>
          </View>

          {isPro && (
            <View style={styles.proBenefitsList}>
              {PRO_BENEFITS.map((benefit, index) => (
                <View key={index} style={styles.proBenefitItem}>
                  <Ionicons name={benefit.icon} size={16} color="#FFD700" />
                  <Text style={styles.proBenefitText}>{benefit.text}</Text>
                </View>
              ))}
              <Text style={styles.proNote}>
                Sans engagement • Annulable à tout moment
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Face Verification Section */}
      <View style={styles.verificationSection}>
        <Text style={styles.verificationLabel}>Vérification d'identité</Text>
        <Text style={styles.verificationHint}>
          Prenez un selfie pour vérifier votre âge (18+ requis)
        </Text>

        {isVerifying ? (
          <View style={styles.verifyingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.verifyingText}>Analyse en cours...</Text>
          </View>
        ) : verificationImage && verificationResult ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: verificationImage }} style={styles.photoPreview} />
            <View style={styles.photoActions}>
              {verificationResult.isAdult ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                  <Text style={styles.verifiedText}>Vérifié (18+)</Text>
                </View>
              ) : (
                <View style={styles.rejectedBadge}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                  <Text style={styles.rejectedText}>Mineur détecté</Text>
                </View>
              )}
              <View style={styles.ageInfo}>
                <Text style={styles.ageText}>
                  Âge détecté : {verificationResult.age} ans
                </Text>
                <Text style={styles.genderText}>
                  Genre : {verificationResult.gender}
                </Text>
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
        disabled={isLoading || !canRegister}
        style={styles.registerButton}
      />

      {!canRegister && verificationImage && (
        <Text style={styles.warningText}>
          L'inscription n'est pas possible pour les mineurs
        </Text>
      )}

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

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={isLoading}
        message="Création de votre compte"
        subMessage="Veuillez patienter..."
      />
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
  verifyingContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  verifyingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
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
    width: 80,
    height: 80,
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
  rejectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  rejectedText: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.error,
  },
  ageInfo: {
    marginTop: theme.spacing.xs,
  },
  ageText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
  },
  genderText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  retakeText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.primary,
  },
  registerButton: {
    marginTop: theme.spacing.sm,
  },
  warningText: {
    textAlign: 'center',
    color: theme.colors.error,
    fontSize: theme.typography.size.sm,
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
  proSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  proSectionTitle: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  accountOption: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  accountOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}08`,
  },
  proOption: {
    position: 'relative',
    overflow: 'hidden',
  },
  proOptionSelected: {
    borderColor: '#FFD700',
    backgroundColor: `#FFD70008`,
  },
  proBadgeGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: theme.borderRadius.md,
    gap: 4,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD700',
  },
  proBadgeTextSelected: {
    color: '#fff',
  },
  accountOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  radioCircleSelected: {
    borderColor: theme.colors.primary,
  },
  radioCircleSelectedPro: {
    borderColor: '#FFD700',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  radioInnerPro: {
    backgroundColor: '#FFD700',
  },
  accountOptionInfo: {
    flex: 1,
  },
  accountOptionTitle: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
  },
  accountOptionPrice: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  accountOptionDesc: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
    marginLeft: 38,
  },
  proPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  proPrice: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: '#FFD700',
  },
  proPricePeriod: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginLeft: 2,
  },
  proBenefitsList: {
    marginTop: theme.spacing.md,
    marginLeft: 38,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: `#FFD70030`,
  },
  proBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  proBenefitText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
  },
  proNote: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
});
