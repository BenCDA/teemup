import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/features/auth/AuthContext';
import { Avatar, Button } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';
import { SPORTS } from '@/constants/sports';

type Step = 'sports' | 'profile-photo' | 'cover-photo';

export default function OnboardingScreen() {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<Step>('sports');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggleSport = (sportKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSports(prev =>
      prev.includes(sportKey)
        ? prev.filter(s => s !== sportKey)
        : [...prev, sportKey]
    );
  };

  const pickImage = async (type: 'profile' | 'cover') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'acces a votre galerie photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'cover' ? [16, 9] : [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (type === 'profile') {
        setProfilePicture(result.assets[0].uri);
      } else {
        setCoverImage(result.assets[0].uri);
      }
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (step === 'sports') {
      if (selectedSports.length === 0) {
        Alert.alert('Sports requis', 'Veuillez selectionner au moins un sport.');
        return;
      }
      setStep('profile-photo');
    } else if (step === 'profile-photo') {
      setStep('cover-photo');
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step === 'profile-photo') {
      setStep('cover-photo');
    } else if (step === 'cover-photo') {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);

    try {
      await updateUser({
        sports: selectedSports,
        profilePicture: profilePicture || undefined,
        coverImage: coverImage || undefined,
        onboardingCompleted: true,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStepNumber = () => {
    switch (step) {
      case 'sports': return 1;
      case 'profile-photo': return 2;
      case 'cover-photo': return 3;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'sports': return 'Quels sports pratiquez-vous ?';
      case 'profile-photo': return 'Ajoutez une photo de profil';
      case 'cover-photo': return 'Ajoutez une photo de couverture';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'sports': return 'Selectionnez les sports que vous pratiquez pour trouver des partenaires.';
      case 'profile-photo': return 'Une photo de profil aide les autres sportifs a vous reconnaitre.';
      case 'cover-photo': return 'Personnalisez votre profil avec une belle photo de couverture.';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(getStepNumber() / 3) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Etape {getStepNumber()}/3</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{getStepTitle()}</Text>
        <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {step === 'sports' && (
          <View style={styles.sportsGrid}>
            {SPORTS.map((sport) => {
              const isSelected = selectedSports.includes(sport.key);
              return (
                <TouchableOpacity
                  key={sport.key}
                  style={[
                    styles.sportCard,
                    isSelected && { borderColor: sport.color, backgroundColor: `${sport.color}15` },
                  ]}
                  onPress={() => toggleSport(sport.key)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.sportIconContainer,
                      { backgroundColor: isSelected ? sport.color : `${sport.color}20` },
                    ]}
                  >
                    <Ionicons
                      name={sport.icon}
                      size={28}
                      color={isSelected ? theme.colors.text.inverse : sport.color}
                    />
                  </View>
                  <Text style={[styles.sportLabel, isSelected && { color: sport.color }]}>
                    {sport.label}
                  </Text>
                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: sport.color }]}>
                      <Ionicons name="checkmark" size={14} color={theme.colors.text.inverse} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 'profile-photo' && (
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.profilePhotoContainer}
              onPress={() => pickImage('profile')}
              activeOpacity={0.8}
            >
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.profilePhotoPreview} />
              ) : (
                <View style={styles.profilePhotoPlaceholder}>
                  <Avatar name={user?.fullName || '?'} size="xl" />
                </View>
              )}
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={24} color={theme.colors.text.inverse} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={() => pickImage('profile')}
            >
              <Text style={styles.changePhotoText}>
                {profilePicture ? 'Changer la photo' : 'Choisir une photo'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'cover-photo' && (
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.coverPhotoContainer}
              onPress={() => pickImage('cover')}
              activeOpacity={0.8}
            >
              {coverImage ? (
                <Image source={{ uri: coverImage }} style={styles.coverPhotoPreview} />
              ) : (
                <View style={styles.coverPhotoPlaceholder}>
                  <Ionicons name="image-outline" size={48} color={theme.colors.text.tertiary} />
                  <Text style={styles.coverPhotoPlaceholderText}>
                    Appuyez pour ajouter une photo
                  </Text>
                </View>
              )}
              <View style={styles.cameraCoverOverlay}>
                <Ionicons name="camera" size={24} color={theme.colors.text.inverse} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={() => pickImage('cover')}
            >
              <Text style={styles.changePhotoText}>
                {coverImage ? 'Changer la photo' : 'Choisir une photo'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {(step === 'profile-photo' || step === 'cover-photo') && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        )}
        <Button
          title={step === 'cover-photo' ? 'Terminer' : 'Continuer'}
          onPress={handleNext}
          loading={isSaving}
          disabled={isSaving || (step === 'sports' && selectedSports.length === 0)}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  sportCard: {
    width: '30%',
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    position: 'relative',
  },
  sportIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  sportLabel: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  profilePhotoContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    position: 'relative',
  },
  profilePhotoPreview: {
    width: '100%',
    height: '100%',
  },
  profilePhotoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  coverPhotoContainer: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  coverPhotoPreview: {
    width: '100%',
    height: '100%',
  },
  coverPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: theme.spacing.sm,
  },
  coverPhotoPlaceholderText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.tertiary,
  },
  cameraCoverOverlay: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  changePhotoText: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.primary,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  skipButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
  },
  nextButton: {
    flex: 1,
  },
});
