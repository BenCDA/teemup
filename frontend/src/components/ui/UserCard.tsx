import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar } from './Avatar';
import { SportBadge } from './SportBadge';
import { Card } from './Card';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface UserCardProps {
  id: string;
  name: string;
  avatar?: string | null;
  bio?: string;
  sports?: string[];
  isOnline?: boolean;
  onPress?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

export function UserCard({
  name,
  avatar,
  bio,
  sports = [],
  isOnline = false,
  onPress,
  onAction,
  actionLabel = 'Ajouter',
}: UserCardProps) {
  return (
    <Card variant="elevated" onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Avatar uri={avatar} name={name} size="lg" showOnline isOnline={isOnline} />
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          {bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {bio}
            </Text>
          )}
        </View>
      </View>

      {sports.length > 0 && (
        <View style={styles.sports}>
          {sports.slice(0, 4).map((sport) => (
            <SportBadge key={sport} sport={sport} size="sm" />
          ))}
        </View>
      )}

      {onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  bio: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  sports: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  actionText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
