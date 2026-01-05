import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@/types';
import { Avatar } from './Avatar';
import { theme } from '@/features/shared/styles/theme';
import * as Haptics from 'expo-haptics';

interface UserCardProps {
  user: User;
  onAddFriend?: () => void;
  isAddingFriend?: boolean;
}

// Default sport cover images
const sportCoverImages: Record<string, string> = {
  'running': 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=400&fit=crop',
  'swimming': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=400&fit=crop',
  'tennis': 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=400&fit=crop',
  'football': 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=400&fit=crop',
  'basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop',
  'cycling': 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&h=400&fit=crop',
  'yoga': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop',
  'gym': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop',
  'boxing': 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&h=400&fit=crop',
};

const defaultCover = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=400&fit=crop';

function getCoverImage(user: User): string {
  // If user has a custom cover image, use it
  if (user.coverImage) return user.coverImage;

  // Otherwise, pick based on first sport
  if (user.sports && user.sports.length > 0) {
    const firstSport = user.sports[0].toLowerCase();
    return sportCoverImages[firstSport] || defaultCover;
  }

  return defaultCover;
}

export function UserCard({ user, onAddFriend, isAddingFriend }: UserCardProps) {
  const handleViewProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/user/${user.id}`);
  };

  const handleAddFriend = () => {
    if (onAddFriend && !isAddingFriend) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onAddFriend();
    }
  };

  // Create username from name
  const username = `@${user.firstName?.toLowerCase() || 'user'}`;

  return (
    <View style={styles.card}>
      {/* Cover Image */}
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: getCoverImage(user) }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      </View>

      {/* Content area */}
      <View style={styles.content}>
        {/* Avatar + Info Row */}
        <View style={styles.infoRow}>
          <View style={styles.avatarContainer}>
            <Avatar
              uri={user.profilePicture}
              name={user.fullName}
              size="lg"
              style={styles.avatar}
            />
          </View>

          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.username}>{username}</Text>
          </View>

          <TouchableOpacity onPress={handleViewProfile} style={styles.seeProfileButton}>
            <Text style={styles.seeProfile}>Voir le profil</Text>
          </TouchableOpacity>
        </View>

        {/* Bio */}
        {user.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {user.bio}
          </Text>
        )}

        {/* Sports Tags */}
        {user.sports && user.sports.length > 0 && (
          <View style={styles.sportsContainer}>
            {user.sports.map((sport, index) => (
              <View key={index} style={styles.sportTagContainer}>
                <Text style={styles.sportTag}>{sport}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Add Friend Button */}
        {onAddFriend && (
          <TouchableOpacity
            style={[styles.addButton, isAddingFriend && styles.addButtonDisabled]}
            onPress={handleAddFriend}
            disabled={isAddingFriend}
            activeOpacity={0.8}
          >
            {isAddingFriend ? (
              <ActivityIndicator size="small" color={theme.colors.text.inverse} />
            ) : (
              <>
                <Ionicons name="person-add" size={18} color={theme.colors.text.inverse} />
                <Text style={styles.addButtonText}>Ajouter en ami</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const AVATAR_SIZE = 56;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  coverContainer: {
    height: 140,
    backgroundColor: theme.colors.background,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: -AVATAR_SIZE / 2 - theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  avatar: {
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  username: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
  },
  seeProfileButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  seeProfile: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.medium,
  },
  bio: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  sportTagContainer: {
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
  },
  sportTag: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.medium,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
});
