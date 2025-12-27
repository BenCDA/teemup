import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { Avatar, Card, SportBadge } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              uri={user?.profilePicture}
              name={user?.fullName || '?'}
              size="xl"
              showOnline
              isOnline={user?.isOnline}
            />
            <Text style={styles.name}>{user?.fullName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>

          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={16} color={theme.colors.primary} />
            <Text style={styles.editButtonText}>Modifier le profil</Text>
          </TouchableOpacity>
        </Card>

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
            onPress={() => {}}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Confidentialité"
            onPress={() => {}}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => {}}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Aide & Support"
            onPress={() => {}}
            showDivider={false}
          />
        </Card>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
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
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  name: {
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  email: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    gap: theme.spacing.xs,
  },
  editButtonText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.semibold,
    fontSize: theme.typography.size.md,
  },
  section: {
    marginTop: theme.spacing.md,
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
    marginTop: theme.spacing.md,
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
    marginTop: theme.spacing.lg,
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
});
