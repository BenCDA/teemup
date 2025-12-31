import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '@/features/notifications/notificationService';
import { Notification } from '@/types';
import { Avatar, EmptyState } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} h`;
    if (diffMinutes < 2880) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getNotificationText = (notification: Notification): string => {
    switch (notification.type) {
      case 'FRIEND_REQUEST':
        return 'souhaite devenir votre ami';
      case 'FRIEND_REQUEST_ACCEPTED':
        return 'a accepté votre demande de connexion';
      case 'NEW_MESSAGE':
        return 'vous a envoyé un message';
      case 'GROUP_INVITATION':
        return 'vous a invité à rejoindre un groupe';
      case 'FOLLOW':
        return 'a commencé à vous suivre';
      default:
        return notification.content || '';
    }
  };

  const notifications = data?.content || [];

  // Separate notifications into "Nouveaux" (recent, within 24h and unread) and "Plus anciens"
  const sections = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const nouveaux: Notification[] = [];
    const anciens: Notification[] = [];

    notifications.forEach((notif) => {
      const notifDate = new Date(notif.createdAt);
      if (!notif.isRead && notifDate > oneDayAgo) {
        nouveaux.push(notif);
      } else {
        anciens.push(notif);
      }
    });

    const result = [];
    if (nouveaux.length > 0) {
      result.push({ title: 'Nouveaux', data: nouveaux });
    }
    if (anciens.length > 0) {
      result.push({ title: 'Plus anciens', data: anciens });
    }

    return result;
  }, [notifications]);

  const renderNotification = ({ item }: { item: Notification }) => {
    const isNew = !item.isRead;

    return (
      <TouchableOpacity
        style={[styles.notificationItem, isNew && styles.unreadItem]}
        onPress={() => !item.isRead && markAsReadMutation.mutate(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Avatar
            name={item.title}
            size="md"
          />
          {isNew && <View style={styles.newIndicator} />}
        </View>

        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            <Text style={styles.notificationName}>{item.title}</Text>
            {' '}{getNotificationText(item)}
          </Text>
          <Text style={[styles.time, isNew && styles.newTime]}>{formatTime(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const hasUnread = notifications.some(n => !n.isRead);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {hasUnread && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={() => markAllAsReadMutation.mutate()}
          >
            <Ionicons name="checkmark-done" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {sections.length > 0 ? (
        <SectionList
          sections={sections}
          renderItem={renderNotification}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="notifications-off-outline"
            title="Aucune notification"
            description="Vos notifications apparaîtront ici"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
  },
  markAllButton: {
    padding: theme.spacing.sm,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  sectionHeader: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  unreadItem: {
    backgroundColor: `${theme.colors.primary}08`,
  },
  avatarContainer: {
    position: 'relative',
  },
  newIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  notificationName: {
    fontWeight: theme.typography.weight.semibold,
  },
  time: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
  },
  newTime: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.medium,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md + 48 + theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
