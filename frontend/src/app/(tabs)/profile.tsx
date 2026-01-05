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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/features/auth/AuthContext';
import { Avatar, Card, SportBadge } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';

const HEADER_HEIGHT = 140;
const AVATAR_SIZE = 100;
const WAVE_COLOR = '#F4D03F';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBio, setEditBio] = useState(user?.bio || '');

  const handleLogout = () => {
    Alert.alert(
      'Deconnexion',
      'Etes-vous sur de vouloir vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se deconnecter',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleSaveProfile = () => {
    // TODO: Implement API call to save profile
    Alert.alert('Succes', 'Profil mis a jour !');
    setShowEditModal(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Wave Header with SafeArea */}
        <View style={[styles.headerContainer, { height: HEADER_HEIGHT + AVATAR_SIZE / 2 + insets.top }]}>
          {/* Status bar background */}
          <View style={[styles.statusBarBg, { height: insets.top }]} />
          <Svg
            height={HEADER_HEIGHT}
            width="100%"
            viewBox="0 0 400 140"
            preserveAspectRatio="none"
            style={[styles.wave, { top: insets.top }]}
          >
            <Path
              d="M0,0 L400,0 L400,90 Q300,140 200,110 Q100,80 0,120 L0,0 Z"
              fill={WAVE_COLOR}
            />
          </Svg>

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
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {user?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={16} color={theme.colors.success} />
              <Text style={styles.verifiedText}>Profil verifie</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {user?.bio && (
            <Card variant="elevated" style={styles.section}>
              <Text style={styles.sectionTitle}>Bio</Text>
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

          <Card variant="elevated" style={styles.menuSection}>
            <MenuItem
              icon="person-outline"
              label="Modifier le profil"
              onPress={() => setShowEditModal(true)}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              label="Confidentialite"
              onPress={() => Alert.alert('Info', 'Fonctionnalite a venir')}
            />
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => Alert.alert('Info', 'Fonctionnalite a venir')}
            />
            <MenuItem
              icon="help-circle-outline"
              label="Aide & Support"
              onPress={() => Alert.alert('Info', 'Fonctionnalite a venir')}
              showDivider={false}
            />
          </Card>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
            <Text style={styles.logoutText}>Se deconnecter</Text>
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
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Modifier le profil</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={styles.modalSave}>Sauver</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.modalAvatarSection}>
              <Avatar
                uri={user?.profilePicture}
                name={user?.fullName || '?'}
                size="xl"
              />
              <TouchableOpacity style={styles.changePhotoButton}>
                <Text style={styles.changePhotoText}>Changer la photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={styles.textArea}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Decrivez-vous en quelques mots..."
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                numberOfLines={4}
                maxLength={200}
              />
              <Text style={styles.charCount}>{editBio.length}/200</Text>
            </View>
          </View>
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
}

function MenuItem({ icon, label, onPress, showDivider = true }: MenuItemProps) {
  return (
    <>
      <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <Ionicons name={icon} size={22} color={theme.colors.primary} />
        <Text style={styles.menuText}>{label}</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
      </TouchableOpacity>
      {showDivider && <View style={styles.menuDivider} />}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    position: 'relative',
  },
  wave: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  statusBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: WAVE_COLOR,
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
    borderColor: theme.colors.surface,
  },
  userInfo: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    backgroundColor: `${theme.colors.success}15`,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
  },
  verifiedText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.success,
    fontWeight: theme.typography.weight.medium,
  },
  content: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bio: {
    fontSize: theme.typography.size.lg,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
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
    gap: theme.spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: theme.typography.size.lg,
    color: theme.colors.text.primary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md + 22 + theme.spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.error}15`,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  logoutText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.error,
  },
  version: {
    textAlign: 'center',
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.size.sm,
    padding: theme.spacing.xl,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
  },
  modalCancel: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
  },
  modalSave: {
    fontSize: theme.typography.size.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.semibold,
  },
  modalContent: {
    padding: theme.spacing.lg,
  },
  modalAvatarSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  changePhotoButton: {
    marginTop: theme.spacing.md,
  },
  changePhotoText: {
    color: theme.colors.primary,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  textArea: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.size.xs,
    marginTop: theme.spacing.xs,
  },
});
