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
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { notificationService } from '@/features/notifications/notificationService';
import { friendService } from '@/features/friends/friendService';
import { Notification } from '@/types';
import { Avatar, EmptyState } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';

// Icon and color config for each notification type
const NOTIFICATION_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }> = {
  FRIEND_REQUEST: { icon: 'person-add', color: '#3B82F6', bgColor: '#3B82F615' },
  FRIEND_REQUEST_ACCEPTED: { icon: 'people', color: '#22C55E', bgColor: '#22C55E15' },
  NEW_MESSAGE: { icon: 'chatbubble-ellipses', color: '#8B5CF6', bgColor: '#8B5CF615' },
  GROUP_INVITATION: { icon: 'people-circle', color: '#F59E0B', bgColor: '#F59E0B15' },
  FOLLOW: { icon: 'heart', color: '#EC4899', bgColor: '#EC489915' },
  SYSTEM: { icon: 'information-circle', color: '#6B7280', bgColor: '#6B728015' },
  EVENT_PARTICIPANT_JOINED: { icon: 'calendar', color: '#10B981', bgColor: '#10B98115' },
};

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const acceptFriendMutation = useMutation({
    mutationFn: friendService.acceptFriendRequest,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  const rejectFriendMutation = useMutation({
    mutationFn: friendService.rejectFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    if (diffMinutes < 2880) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getNotificationText = (notification: Notification): string => {
    switch (notification.type) {
      case 'FRIEND_REQUEST':
        return 'veut devenir votre ami';
      case 'FRIEND_REQUEST_ACCEPTED':
        return 'a accepté votre demande';
      case 'NEW_MESSAGE':
        return 'vous a envoyé un message';
      case 'GROUP_INVITATION':
        return 'vous invite à rejoindre un groupe';
      case 'FOLLOW':
        return 'a commencé à vous suivre';
      case 'EVENT_PARTICIPANT_JOINED':
        return 'a rejoint votre événement';
      default:
        return notification.content || '';
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on type
    if (notification.type === 'NEW_MESSAGE' && notification.referenceId) {
      router.push(`/conversation/${notification.referenceId}`);
    } else if (notification.type === 'EVENT_PARTICIPANT_JOINED' && notification.referenceId) {
      router.push(`/event/${notification.referenceId}`);
    } else if (notification.type === 'FRIEND_REQUEST' && notification.fromUser) {
      router.push(`/user/${notification.fromUser.id}`);
    } else if (notification.fromUser) {
      router.push(`/user/${notification.fromUser.id}`);
    }
  };

  const notifications = data?.content || [];

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
    const config = NOTIFICATION_CONFIG[item.type] || NOTIFICATION_CONFIG.SYSTEM;
    const isFriendRequest = item.type === 'FRIEND_REQUEST';

    return (
      <TouchableOpacity
        style={[styles.notificationItem, isNew && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {/* Avatar with type badge */}
        <View style={styles.avatarContainer}>
          <Avatar
            uri={item.fromUser?.profilePicture}
            name={item.fromUser?.fullName || item.title}
            size="md"
          />
          <View style={[styles.typeBadge, { backgroundColor: config.color }]}>
            <Ionicons name={config.icon} size={12} color="#fff" />
          </View>
        </View>

        <View style={styles.notificationContent}>
          {/* Main text */}
          <Text style={styles.notificationText} numberOfLines={2}>
            <Text style={styles.notificationName}>
              {item.fromUser?.fullName || item.title}
            </Text>
            {' '}{getNotificationText(item)}
          </Text>

          {/* Time */}
          <Text style={[styles.time, isNew && styles.newTime]}>
            {formatTime(item.createdAt)}
          </Text>

          {/* Friend request actions */}
          {isFriendRequest && item.referenceId && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  acceptFriendMutation.mutate(item.referenceId!);
                }}
                disabled={acceptFriendMutation.isPending}
              >
                {acceptFriendMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.acceptButtonText}>Accepter</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  rejectFriendMutation.mutate(item.referenceId!);
                }}
                disabled={rejectFriendMutation.isPending}
              >
                <Text style={styles.rejectButtonText}>Refuser</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Unread indicator */}
        {isNew && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string; data: Notification[] } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.title === 'Nouveaux' && (
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
        </View>
      )}
    </View>
  );

  const hasUnread = notifications.some(n => !n.isRead);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {hasUnread && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              markAllAsReadMutation.mutate();
            }}
          >
            <Ionicons name="checkmark-done" size={20} color={theme.colors.primary} />
            <Text style={styles.markAllText}>Tout lire</Text>
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: 20,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  sectionBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'flex-start',
    gap: 12,
  },
  unreadItem: {
    backgroundColor: `${theme.colors.primary}06`,
  },
  avatarContainer: {
    position: 'relative',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    lineHeight: 21,
  },
  notificationName: {
    fontWeight: '600',
  },
  time: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  newTime: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: theme.colors.background,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rejectButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
