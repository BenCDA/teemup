import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@/types';
import { Avatar } from './Avatar';
import { ProBadge } from './ProBadge';
import { theme } from '@/features/shared/styles/theme';
import * as Haptics from 'expo-haptics';
import { getSportConfig, getSportLabel } from '@/constants/sports';
import { getUserCoverImage } from '@/constants/defaultImages';

interface UserCardProps {
  user: User;
  onAddFriend?: () => void;
  onCancelRequest?: () => void;
  isAddingFriend?: boolean;
  hasPendingRequest?: boolean;
}

export function UserCard({ user, onAddFriend, onCancelRequest, isAddingFriend, hasPendingRequest }: UserCardProps) {
  const handleViewProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/user/${user.id}`);
  };

  const handleFriendAction = () => {
    if (isAddingFriend) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (hasPendingRequest && onCancelRequest) {
      Alert.alert(
        'Annuler la demande',
        `Voulez-vous annuler votre demande d'ami à ${user.firstName} ?`,
        [
          { text: 'Non', style: 'cancel' },
          {
            text: 'Oui, annuler',
            style: 'destructive',
            onPress: onCancelRequest,
          },
        ]
      );
    } else if (onAddFriend) {
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
          source={{ uri: getUserCoverImage(user) }}
          style={styles.coverImage}
          resizeMode="cover"
        />
        {/* Pro Badge on cover */}
        {user.isPro && (
          <View style={styles.proBadgeContainer}>
            <ProBadge size="sm" />
          </View>
        )}
      </View>

      {/* Content area */}
      <View style={styles.content}>
        {/* Avatar + Info Row */}
        <View style={styles.infoRow}>
          <View style={styles.avatarContainer}>
            <Avatar
              uri={user.profilePicture}
              name={user.fullName}
              userId={user.id}
              size="lg"
              style={styles.avatar}
            />
          </View>

          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{user.fullName}</Text>
            </View>
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
            {user.sports.map((sport, index) => {
              const config = getSportConfig(sport);
              const color = config?.color || theme.colors.primary;
              return (
                <View
                  key={index}
                  style={[
                    styles.sportTagContainer,
                    { backgroundColor: `${color}15`, borderColor: `${color}30` },
                  ]}
                >
                  {config && (
                    <Ionicons name={config.icon} size={12} color={color} style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.sportTag, { color }]}>{getSportLabel(sport)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Add Friend Button */}
        {(onAddFriend || hasPendingRequest) && (
          <TouchableOpacity
            style={[
              styles.addButton,
              isAddingFriend && styles.addButtonDisabled,
              hasPendingRequest && styles.pendingButton,
            ]}
            onPress={handleFriendAction}
            disabled={isAddingFriend}
            activeOpacity={0.8}
          >
            {isAddingFriend ? (
              <ActivityIndicator size="small" color={theme.colors.text.inverse} />
            ) : hasPendingRequest ? (
              <>
                <Ionicons name="time-outline" size={18} color={theme.colors.text.inverse} />
                <Text style={styles.addButtonText}>Demande envoyée</Text>
              </>
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
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  proBadgeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    flexShrink: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
  },
  sportTag: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
    minHeight: 48,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  pendingButton: {
    backgroundColor: theme.colors.error,
  },
  addButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
});
