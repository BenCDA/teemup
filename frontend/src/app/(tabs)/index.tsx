import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { messagingService } from '@/features/messaging/messagingService';
import { friendService } from '@/features/friends/friendService';
import { Conversation, User } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Avatar } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';

export default function MessagesScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagingService.getConversations,
  });

  const { data: friends } = useQuery({
    queryKey: ['friends'],
    queryFn: friendService.getFriends,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const getConversationName = (conversation: Conversation): string => {
    if (conversation.name) return conversation.name;
    if (conversation.type === 'PRIVATE') {
      const otherUser = conversation.participants.find(p => p.id !== user?.id);
      return otherUser?.fullName || 'Utilisateur';
    }
    return 'Groupe';
  };

  const getOtherUser = (conversation: Conversation): User | undefined => {
    if (conversation.type === 'PRIVATE') {
      return conversation.participants.find(p => p.id !== user?.id);
    }
    return undefined;
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const startConversation = async (friendId: string) => {
    try {
      const conversation = await messagingService.createConversation([friendId]);
      router.push(`/conversation/${conversation.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const filteredConversations = conversations?.filter(conv => {
    if (!searchQuery) return true;
    const name = getConversationName(conv).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const renderFriendAvatar = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.friendAvatarContainer}
      onPress={() => startConversation(item.id)}
    >
      <Avatar
        uri={item.profilePicture}
        name={item.fullName}
        size="lg"
        showOnline
        isOnline={item.isOnline}
      />
      <Text style={styles.friendName} numberOfLines={1}>
        {item.firstName}
      </Text>
    </TouchableOpacity>
  );

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherUser(item);
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => router.push(`/conversation/${item.id}`)}
      >
        <Avatar
          uri={otherUser?.profilePicture}
          name={getConversationName(item)}
          size="lg"
          showOnline
          isOnline={otherUser?.isOnline}
        />

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, hasUnread && styles.unreadText]} numberOfLines={1}>
              {getConversationName(item)}
            </Text>
            <Text style={[styles.time, hasUnread && styles.unreadTime]}>
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>

          <View style={styles.conversationFooter}>
            <Text
              style={[styles.lastMessage, hasUnread && styles.unreadMessage]}
              numberOfLines={1}
            >
              {item.lastMessage?.content || 'Aucun message'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          placeholderTextColor={theme.colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Friends Horizontal Scroll */}
      {friends && friends.length > 0 && (
        <View style={styles.friendsSection}>
          <FlatList
            data={friends}
            renderItem={renderFriendAvatar}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendsList}
          />
        </View>
      )}

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={filteredConversations?.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContent}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.border} />
            <Text style={styles.emptyText}>Aucune conversation</Text>
            <Text style={styles.emptySubtext}>
              Commencez à discuter avec vos amis !
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
    backgroundColor: theme.colors.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
  },
  friendsSection: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
  },
  friendsList: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  friendAvatarContainer: {
    alignItems: 'center',
    width: 70,
  },
  friendName: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  unreadText: {
    fontWeight: theme.typography.weight.bold,
  },
  time: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
  },
  unreadTime: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.semibold,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  unreadMessage: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weight.medium,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md + 56 + theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});
