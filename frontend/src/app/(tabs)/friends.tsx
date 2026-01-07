import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { friendService } from '@/features/friends/friendService';
import { messagingService } from '@/features/messaging/messagingService';
import { notificationService } from '@/features/notifications/notificationService';
import { User, FriendRequest, Notification } from '@/types';
import { Avatar, EmptyState } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';

type TabType = 'friends' | 'requests' | 'notifications';

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: friends, isLoading: friendsLoading, refetch: refetchFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: friendService.getFriends,
  });

  const { data: requests, isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ['friendRequests'],
    queryFn: friendService.getPendingReceivedRequests,
  });

  const { data: notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(0, 50),
  });

  const acceptMutation = useMutation({
    mutationFn: friendService.acceptFriendRequest,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: friendService.rejectFriendRequest,
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetchFriends(), refetchRequests(), refetchNotifications()]);
    setRefreshing(false);
  }, [refetchFriends, refetchRequests, refetchNotifications]);

  const viewProfile = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/user/${userId}`);
  };

  const startConversation = async (friendId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const conversation = await messagingService.createConversation([friendId]);
      router.push(`/conversation/${conversation.id}`);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de démarrer la conversation');
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on type
    if (notification.type === 'FRIEND_REQUEST' || notification.type === 'FRIEND_REQUEST_ACCEPTED') {
      if (notification.fromUser) {
        router.push(`/user/${notification.fromUser.id}`);
      }
    } else if (notification.type === 'NEW_MESSAGE' && notification.referenceId) {
      router.push(`/conversation/${notification.referenceId}`);
    }
  };

  const renderFriend = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <TouchableOpacity style={styles.userTouchable} onPress={() => viewProfile(item.id)}>
        <Avatar
          uri={item.profilePicture}
          name={item.fullName}
          size="md"
          showOnline
          isOnline={item.isOnline}
        />
        <View style={styles.userContent}>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={[styles.userStatus, item.isOnline && styles.onlineStatus]}>
            {item.isOnline ? 'En ligne' : 'Hors ligne'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.chatButton} onPress={() => startConversation(item.id)}>
        <Ionicons name="chatbubble" size={18} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestItem}>
      <TouchableOpacity onPress={() => viewProfile(item.sender.id)}>
        <Avatar uri={item.sender.profilePicture} name={item.sender.fullName} size="md" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.userContent} onPress={() => viewProfile(item.sender.id)}>
        <Text style={styles.userName}>{item.sender.fullName}</Text>
        <Text style={styles.requestText}>Souhaite devenir votre ami</Text>
      </TouchableOpacity>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => acceptMutation.mutate(item.id)}
        >
          <Ionicons name="checkmark" size={20} color={theme.colors.text.inverse} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => rejectMutation.mutate(item.id)}
        >
          <Ionicons name="close" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNotification = ({ item }: { item: Notification }) => {
    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'FRIEND_REQUEST': return 'person-add';
        case 'FRIEND_REQUEST_ACCEPTED': return 'people';
        case 'NEW_MESSAGE': return 'chatbubble';
        case 'FOLLOW': return 'heart';
        default: return 'notifications';
      }
    };

    const getNotificationColor = (type: string) => {
      switch (type) {
        case 'FRIEND_REQUEST': return theme.colors.primary;
        case 'FRIEND_REQUEST_ACCEPTED': return theme.colors.success;
        case 'NEW_MESSAGE': return theme.colors.primary;
        case 'FOLLOW': return '#E91E63';
        default: return theme.colors.text.secondary;
      }
    };

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.notificationUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.notificationIcon, { backgroundColor: `${getNotificationColor(item.type)}15` }]}>
          <Ionicons name={getNotificationIcon(item.type) as any} size={20} color={getNotificationColor(item.type)} />
        </View>

        {item.fromUser && (
          <Avatar uri={item.fromUser.profilePicture} name={item.fromUser.fullName} size="sm" style={styles.notificationAvatar} />
        )}

        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          {item.content && (
            <Text style={styles.notificationText} numberOfLines={1}>{item.content}</Text>
          )}
          <Text style={styles.notificationTime}>
            {new Date(item.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const isLoading = activeTab === 'friends'
    ? friendsLoading
    : activeTab === 'requests'
      ? requestsLoading
      : notificationsLoading;

  const notificationsList = notifications?.content || [];
  const unreadCount = notificationsList.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Amis ({friends?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Demandes
          </Text>
          {requests && requests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{requests.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
          onPress={() => setActiveTab('notifications')}
        >
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : activeTab === 'friends' ? (
        <FlatList<User>
          data={friends || []}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={!friends?.length ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="Aucun ami pour le moment"
              description="Découvrez des sportifs et ajoutez-les en ami !"
              actionLabel="Découvrir"
              onAction={() => router.push('/(tabs)/discover')}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : activeTab === 'requests' ? (
        <FlatList<FriendRequest>
          data={requests || []}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={!requests?.length ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="mail-outline"
              title="Aucune demande en attente"
              description="Les nouvelles demandes d'amis apparaîtront ici"
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <FlatList<Notification>
          data={notificationsList}
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
          contentContainerStyle={!notificationsList.length ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-outline"
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.semibold,
  },
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    backgroundColor: theme.colors.surface,
  },
  emptyContainer: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  userTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.md,
  },
  userContent: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
  },
  userStatus: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  onlineStatus: {
    color: theme.colors.success,
  },
  requestText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md + 48 + theme.spacing.md,
  },
  // Notification styles
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  notificationUnread: {
    backgroundColor: `${theme.colors.primary}08`,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationAvatar: {
    marginLeft: -8,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
  },
  notificationText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  notificationTime: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
});
