import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar } from './Avatar';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface ConversationItemProps {
  id: string;
  name: string;
  avatar?: string | null;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  isOnline?: boolean;
  onPress: () => void;
}

export function ConversationItem({
  name,
  avatar,
  lastMessage,
  timestamp,
  unreadCount = 0,
  isOnline = false,
  onPress,
}: ConversationItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Avatar uri={avatar} name={name} size="md" showOnline isOnline={isOnline} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
        </View>

        <View style={styles.footer}>
          <Text
            style={[styles.message, unreadCount > 0 && styles.messageUnread]}
            numberOfLines={1}
          >
            {lastMessage || 'Aucun message'}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  timestamp: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginLeft: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    flex: 1,
  },
  messageUnread: {
    color: Colors.text,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
