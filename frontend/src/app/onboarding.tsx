import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/features/auth/AuthContext';
import { Avatar, Button } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';
import { SPORTS, getPopularSports, searchSports, SportConfig } from '@/constants/sports';

type Step = 'sports' | 'profile-photo' | 'cover-photo';

export default function OnboardingScreen() {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<Step>('sports');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllSports, setShowAllSports] = useState(false);

  const isPro = user?.isPro;

  // Filter sports based on search and showAll
  const displayedSports = useMemo(() => {
    if (searchQuery.trim()) {
      return searchSports(searchQuery);
    }
    if (showAllSports) {
      return SPORTS.filter(s => s.key !== 'other');
    }
    return getPopularSports();
  }, [searchQuery, showAllSports]);

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
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à votre galerie photo.');
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
        Alert.alert('Sports requis', 'Veuillez sélectionner au moins un sport.');
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
      Alert.alert('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
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
      case 'sports':
        return isPro ? 'Quels sports proposez-vous ?' : 'Quels sports pratiquez-vous ?';
      case 'profile-photo':
        return isPro ? 'Ajoutez votre logo ou photo' : 'Ajoutez une photo de profil';
      case 'cover-photo':
        return 'Ajoutez une photo de couverture';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'sports':
        return isPro
          ? 'Sélectionnez les sports que vous proposez pour vos événements.'
          : 'Sélectionnez les sports que vous pratiquez pour trouver des partenaires.';
      case 'profile-photo':
        return isPro
          ? 'Une photo professionnelle aide à établir la confiance avec vos clients.'
          : 'Une photo de profil aide les autres sportifs à vous reconnaître.';
      case 'cover-photo':
        return 'Personnalisez votre profil avec une belle photo de couverture.';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(getStepNumber() / 3) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Étape {getStepNumber()}/3</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{getStepTitle()}</Text>
        <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {step === 'sports' && (
          <View>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un sport..."
                placeholderTextColor={theme.colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Toggle Popular / All Sports */}
            {!searchQuery && (
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, !showAllSports && styles.toggleButtonActive]}
                  onPress={() => setShowAllSports(false)}
                >
                  <Ionicons name="star" size={16} color={!showAllSports ? theme.colors.primary : theme.colors.text.tertiary} />
                  <Text style={[styles.toggleText, !showAllSports && styles.toggleTextActive]}>
                    Populaires
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, showAllSports && styles.toggleButtonActive]}
                  onPress={() => setShowAllSports(true)}
                >
                  <Ionicons name="grid" size={16} color={showAllSports ? theme.colors.primary : theme.colors.text.tertiary} />
                  <Text style={[styles.toggleText, showAllSports && styles.toggleTextActive]}>
                    Tous ({SPORTS.length - 1})
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Selected Count */}
            {selectedSports.length > 0 && (
              <View style={styles.selectedCount}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={styles.selectedCountText}>
                  {selectedSports.length} sport{selectedSports.length > 1 ? 's' : ''} sélectionné{selectedSports.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {/* Sports Grid */}
            <View style={styles.sportsGrid}>
              {displayedSports.map((sport) => {
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
                    <Text style={[styles.sportLabel, isSelected && { color: sport.color }]} numberOfLines={2}>
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

            {/* No Results */}
            {displayedSports.length === 0 && searchQuery && (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={48} color={theme.colors.text.tertiary} />
                <Text style={styles.noResultsText}>Aucun sport trouvé</Text>
                <Text style={styles.noResultsSubtext}>Essayez un autre terme de recherche</Text>
              </View>
            )}
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
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 26,
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
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.xs,
  },
  // Toggle buttons
  toggleContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.xs,
  },
  toggleButtonActive: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  toggleText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.weight.medium,
  },
  toggleTextActive: {
    color: theme.colors.primary,
  },
  // Selected count
  selectedCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  selectedCountText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.success,
    fontWeight: theme.typography.weight.medium,
  },
  // Sports grid
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  sportCard: {
    width: '30%',
    aspectRatio: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: theme.spacing.xs,
    position: 'relative',
  },
  sportIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  sportLabel: {
    fontSize: theme.typography.size.xs,
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
  // No results
  noResults: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  noResultsText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.secondary,
  },
  noResultsSubtext: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
  },
  // Photo sections
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
