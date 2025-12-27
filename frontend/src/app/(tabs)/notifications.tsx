import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '@/features/notifications/notificationService';
import { Notification } from '@/types';
import { EmptyState } from '@/components/ui';
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

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case 'FRIEND_REQUEST':
        return { icon: 'person-add', color: theme.colors.primary };
      case 'FRIEND_REQUEST_ACCEPTED':
        return { icon: 'checkmark-circle', color: theme.colors.success };
      case 'NEW_MESSAGE':
        return { icon: 'chatbubble', color: theme.colors.info };
      case 'GROUP_INVITATION':
        return { icon: 'people-circle', color: theme.colors.primary };
      default:
        return { icon: 'notifications', color: theme.colors.text.secondary };
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)} h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const config = getNotificationConfig(item.type);

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        onPress={() => !item.isRead && markAsReadMutation.mutate(item.id)}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${config.color}15` }]}>
          <Ionicons
            name={config.icon as any}
            size={22}
            color={config.color}
          />
        </View>

        <View style={styles.notificationContent}>
          <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
          {item.content && (
            <Text style={styles.content} numberOfLines={2}>
              {item.content}
            </Text>
          )}
          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>

        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const notifications = data?.content || [];
  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <View style={styles.container}>
      {hasUnread && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={() => markAllAsReadMutation.mutate()}
        >
          <Ionicons name="checkmark-done" size={18} color={theme.colors.primary} />
          <Text style={styles.markAllText}>Tout marquer comme lu</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="Aucune notification"
              description="Vos notifications apparaîtront ici"
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  markAllText: {
    color: theme.colors.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  unreadItem: {
    backgroundColor: `${theme.colors.primary}08`,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
  },
  unreadTitle: {
    fontWeight: theme.typography.weight.semibold,
  },
  content: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
  },
  time: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md + 44 + theme.spacing.md,
  },
});
