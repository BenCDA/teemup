import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

type NotificationType = 'friend_request' | 'friend_accepted' | 'message' | 'system';

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  avatar?: string | null;
  senderName?: string;
  timestamp: string;
  isRead?: boolean;
  onPress?: () => void;
}

const typeConfig: Record<NotificationType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  friend_request: { icon: 'person-add', color: Colors.primary },
  friend_accepted: { icon: 'checkmark-circle', color: Colors.success },
  message: { icon: 'chatbubble', color: Colors.secondary },
  system: { icon: 'notifications', color: Colors.textSecondary },
};

export function NotificationItem({
  type,
  title,
  message,
  avatar,
  senderName,
  timestamp,
  isRead = false,
  onPress,
}: NotificationItemProps) {
  const config = typeConfig[type];

  return (
    <TouchableOpacity
      style={[styles.container, !isRead && styles.unread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {avatar && senderName ? (
          <Avatar uri={avatar} name={senderName} size="md" />
        ) : (
          <View style={[styles.iconBadge, { backgroundColor: config.color }]}>
            <Ionicons name={config.icon} size={20} color={Colors.textOnPrimary} />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>

      {!isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  unread: {
    backgroundColor: `${Colors.primary}08`,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  timestamp: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: Spacing.sm,
  },
});
