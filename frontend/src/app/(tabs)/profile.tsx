import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/features/auth/AuthContext';
import api from '@/features/shared/api';
import { Avatar, Card, SportBadge, ProBadge } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';
import { SPORTS } from '@/constants/sports';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 180;
const AVATAR_SIZE = 110;

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editProfilePicture, setEditProfilePicture] = useState<string | null>(user?.profilePicture || null);
  const [editCoverImage, setEditCoverImage] = useState<string | null>(user?.coverImage || null);
  const [editSports, setEditSports] = useState<string[]>(user?.sports || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const openEditModal = () => {
    setEditBio(user?.bio || '');
    setEditProfilePicture(user?.profilePicture || null);
    setEditCoverImage(user?.coverImage || null);
    setEditSports(user?.sports || []);
    setShowEditModal(true);
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
        setEditProfilePicture(result.assets[0].uri);
      } else {
        setEditCoverImage(result.assets[0].uri);
      }
    }
  };

  const toggleSport = (sportKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditSports(prev =>
      prev.includes(sportKey)
        ? prev.filter(s => s !== sportKey)
        : [...prev, sportKey]
    );
  };

  const uploadImageToCloudinary = async (uri: string, type: 'profile' | 'cover'): Promise<string> => {
    const endpoint = type === 'profile' ? '/upload/profile-picture' : '/upload/cover-image';
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);

    const response = await api.post<{ url: string }>(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data.url;
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let profilePictureUrl = editProfilePicture || undefined;
      let coverImageUrl = editCoverImage || undefined;

      // Upload to Cloudinary if the image is a new local file (not already an https URL)
      if (editProfilePicture && !editProfilePicture.startsWith('http')) {
        profilePictureUrl = await uploadImageToCloudinary(editProfilePicture, 'profile');
      }
      if (editCoverImage && !editCoverImage.startsWith('http')) {
        coverImageUrl = await uploadImageToCloudinary(editCoverImage, 'cover');
      }

      if (updateUser) {
        await updateUser({
          bio: editBio,
          profilePicture: profilePictureUrl,
          coverImage: coverImageUrl,
          sports: editSports,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Profil mis à jour !');
      setShowEditModal(false);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cover Image Header */}
        <View style={styles.headerContainer}>
          {user?.coverImage ? (
            <ImageBackground
              source={{ uri: user.coverImage }}
              style={styles.coverImage}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.coverGradient}
              />
            </ImageBackground>
          ) : (
            <LinearGradient
              colors={[theme.colors.primary, '#1a1a2e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.coverPlaceholder}
            />
          )}

          {/* Edit Button */}
          <TouchableOpacity
            style={styles.editHeaderButton}
            onPress={openEditModal}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil" size={16} color="#fff" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={user?.profilePicture}
              name={user?.fullName || '?'}
              size="xl"
              showOnline
              isOnline={user?.isOnline}
              style={styles.avatar}
            />
            {user?.isVerified && (
              <View style={styles.verifiedIcon}>
                <Ionicons name="checkmark-circle" size={28} color={theme.colors.success} />
              </View>
            )}
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user?.fullName}</Text>
            {user?.isPro && <ProBadge size="sm" style={styles.proBadgeInline} />}
          </View>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.badgesRow}>
            {user?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={14} color={theme.colors.success} />
                <Text style={styles.verifiedText}>Vérifié</Text>
              </View>
            )}
            {user?.isPro && (
              <View style={styles.proBadgeSmall}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.proText}>Membre Pro</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.sports?.length || 0}</Text>
              <Text style={styles.statLabel}>Sports</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.verifiedAge || '-'}</Text>
              <Text style={styles.statLabel}>Âge</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {user?.verifiedGender === 'MALE' ? 'H' : user?.verifiedGender === 'FEMALE' ? 'F' : '-'}
              </Text>
              <Text style={styles.statLabel}>Genre</Text>
            </View>
          </View>

          {user?.bio && (
            <Card variant="elevated" style={styles.section}>
              <Text style={styles.sectionTitle}>À propos</Text>
              <Text style={styles.bio}>{user.bio}</Text>
            </Card>
          )}

          {user?.sports && user.sports.length > 0 && (
            <Card variant="elevated" style={styles.section}>
              <Text style={styles.sectionTitle}>Mes sports</Text>
              <View style={styles.sportsContainer}>
                {user.sports.map((sport, index) => (
                  <SportBadge key={index} sport={sport} size="md" showLabel />
                ))}
              </View>
            </Card>
          )}

          {/* Pro Subscription Card */}
          {!user?.isPro && (
            <TouchableOpacity
              style={styles.proCard}
              onPress={() => router.push('/settings/subscription')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.proCardGradient}
              >
                <View style={styles.proCardContent}>
                  <View style={styles.proCardIcon}>
                    <Ionicons name="rocket" size={24} color="#fff" />
                  </View>
                  <View style={styles.proCardText}>
                    <Text style={styles.proCardTitle}>Passez Pro</Text>
                    <Text style={styles.proCardSubtitle}>Créez des événements payants</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <Card variant="elevated" style={styles.menuSection}>
            <MenuItem
              icon="person-outline"
              label="Modifier le profil"
              onPress={openEditModal}
            />
            {user?.isPro ? (
              <MenuItem
                icon="star"
                label="Mon abonnement Pro"
                onPress={() => router.push('/settings/subscription')}
                iconColor="#FFD700"
              />
            ) : null}
            <MenuItem
              icon="settings-outline"
              label="Paramètres"
              onPress={() => router.push('/settings/preferences')}
            />
            <MenuItem
              icon="help-circle-outline"
              label="Aide & Support"
              onPress={() => router.push('/settings/help')}
              showDivider={false}
            />
          </Card>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)} disabled={isSaving}>
              <Text style={[styles.modalCancel, isSaving && styles.modalTextDisabled]}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Modifier le profil</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={styles.modalSave}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {/* Cover Photo Section */}
            <TouchableOpacity
              style={styles.coverPhotoSection}
              onPress={() => pickImage('cover')}
              activeOpacity={0.8}
            >
              {editCoverImage ? (
                <Image source={{ uri: editCoverImage }} style={styles.coverPhotoPreview} />
              ) : (
                <LinearGradient
                  colors={[theme.colors.primary, '#1a1a2e']}
                  style={styles.coverPhotoPlaceholder}
                >
                  <Ionicons name="image-outline" size={32} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.coverPhotoPlaceholderText}>Ajouter une bannière</Text>
                </LinearGradient>
              )}
              <View style={styles.coverPhotoOverlay}>
                <Ionicons name="camera" size={18} color="#fff" />
                <Text style={styles.coverPhotoOverlayText}>Modifier</Text>
              </View>
            </TouchableOpacity>

            {/* Profile Photo Section */}
            <View style={styles.modalAvatarSection}>
              <TouchableOpacity onPress={() => pickImage('profile')} activeOpacity={0.8}>
                <View style={styles.avatarEditContainer}>
                  <Avatar
                    uri={editProfilePicture || undefined}
                    name={user?.fullName || '?'}
                    size="xl"
                  />
                  <View style={styles.avatarEditOverlay}>
                    <Ionicons name="camera" size={18} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.changePhotoButton} onPress={() => pickImage('profile')}>
                <Text style={styles.changePhotoText}>Changer la photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {/* Bio Section */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={styles.textArea}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Décrivez-vous en quelques mots..."
                  placeholderTextColor={theme.colors.text.tertiary}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                />
                <Text style={styles.charCount}>{editBio.length}/200</Text>
              </View>

              {/* Sports Section */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Mes sports
                  {editSports.length > 0 && (
                    <Text style={styles.sportCount}> • {editSports.length} sélectionné{editSports.length > 1 ? 's' : ''}</Text>
                  )}
                </Text>
                <View style={styles.sportsGrid}>
                  {SPORTS.map((sport) => {
                    const isSelected = editSports.includes(sport.key);
                    return (
                      <TouchableOpacity
                        key={sport.key}
                        style={[
                          styles.sportChip,
                          isSelected && { backgroundColor: sport.color, borderColor: sport.color },
                        ]}
                        onPress={() => toggleSport(sport.key)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={sport.icon}
                          size={18}
                          color={isSelected ? '#fff' : sport.color}
                        />
                        <Text
                          style={[
                            styles.sportChipText,
                            isSelected && styles.sportChipTextActive,
                          ]}
                        >
                          {sport.label}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showDivider?: boolean;
  iconColor?: string;
}

function MenuItem({ icon, label, onPress, showDivider = true, iconColor }: MenuItemProps) {
  const color = iconColor || theme.colors.primary;
  return (
    <>
      <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
        <View style={[styles.menuIconContainer, iconColor && { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.menuText}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
      </TouchableOpacity>
      {showDivider && <View style={styles.menuDivider} />}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    height: HEADER_HEIGHT + AVATAR_SIZE / 2,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: HEADER_HEIGHT,
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  coverPlaceholder: {
    width: '100%',
    height: HEADER_HEIGHT,
  },
  editHeaderButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -AVATAR_SIZE / 2,
    zIndex: 10,
  },
  avatar: {
    borderWidth: 4,
    borderColor: theme.colors.background,
  },
  verifiedIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: theme.colors.background,
    borderRadius: 14,
  },
  userInfo: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  proBadgeInline: {
    marginTop: 2,
  },
  email: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.sm,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.colors.success}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 13,
    color: theme.colors.success,
    fontWeight: '600',
  },
  proBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD70020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  proText: {
    fontSize: 13,
    color: '#B8860B',
    fontWeight: '600',
  },
  proCard: {
    marginBottom: theme.spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  proCardGradient: {
    padding: 16,
  },
  proCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  proCardText: {
    flex: 1,
  },
  proCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  proCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  content: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bio: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  menuSection: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${theme.colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 60,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: `${theme.colors.error}10`,
    borderRadius: 14,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
  version: {
    textAlign: 'center',
    color: theme.colors.text.tertiary,
    fontSize: 13,
    padding: theme.spacing.xl,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  modalCancel: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  modalSave: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    padding: theme.spacing.lg,
  },
  modalAvatarSection: {
    alignItems: 'center',
    marginTop: -AVATAR_SIZE / 2,
    marginBottom: theme.spacing.lg,
  },
  changePhotoButton: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: `${theme.colors.primary}12`,
    borderRadius: 20,
  },
  changePhotoText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: theme.spacing.xl,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sportCount: {
    textTransform: 'none',
    color: theme.colors.primary,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  charCount: {
    textAlign: 'right',
    color: theme.colors.text.tertiary,
    fontSize: 12,
    marginTop: 6,
  },
  modalTextDisabled: {
    opacity: 0.5,
  },
  modalScrollView: {
    flex: 1,
  },
  coverPhotoSection: {
    height: 180,
    backgroundColor: theme.colors.background,
    position: 'relative',
  },
  coverPhotoPreview: {
    width: '100%',
    height: '100%',
  },
  coverPhotoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  coverPhotoPlaceholderText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  coverPhotoOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coverPhotoOverlayText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  avatarEditContainer: {
    position: 'relative',
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: 8,
  },
  sportChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  sportChipTextActive: {
    color: '#fff',
  },
});
