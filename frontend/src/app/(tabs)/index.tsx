import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { messagingService } from '@/features/messaging/messagingService';
import { friendService } from '@/features/friends/friendService';
import socketService from '@/features/shared/socket';
import { Conversation, User } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Avatar } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';

export default function MessagesScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
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

  // Real-time: refresh conversations list on new messages and online/offline status changes
  useEffect(() => {
    const unsubMessage = socketService.on('newMessage', () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
    const unsubOnline = socketService.on('userOnline', () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
    const unsubOffline = socketService.on('userOffline', () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    return () => {
      unsubMessage();
      unsubOnline();
      unsubOffline();
    };
  }, [queryClient]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const startConversation = async (friendId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const conversation = await messagingService.createConversation([friendId]);
      router.push(`/conversation/${conversation.id}`);
    } catch {
      Alert.alert('Erreur', 'Impossible de démarrer la conversation');
    }
  };

  const filteredConversations = conversations?.filter(conv => {
    if (!searchQuery) return true;
    const name = getConversationName(conv).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  // Sort: online friends first
  const sortedFriends = friends?.slice().sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return 0;
  });

  const renderActiveUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.activeUserItem}
      onPress={() => startConversation(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.activeUserAvatarWrapper}>
        {item.isOnline ? (
          <LinearGradient
            colors={['#833AB4', '#FD1D1D', '#F77737']}
            style={styles.activeUserGradient}
          >
            <View style={styles.activeUserAvatarInner}>
              <Avatar uri={item.profilePicture} name={item.fullName} size="lg" />
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.activeUserAvatarOffline}>
            <Avatar uri={item.profilePicture} name={item.fullName} size="lg" />
          </View>
        )}
        {item.isOnline && (
          <View style={styles.onlineDot}>
            <View style={styles.onlineDotInner} />
          </View>
        )}
      </View>
      <Text style={styles.activeUserName} numberOfLines={1}>{item.firstName}</Text>
    </TouchableOpacity>
  );

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherUser(item);
    const hasUnread = (item.unreadCount || 0) > 0;
    const isOnline = otherUser?.isOnline;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/conversation/${item.id}`);
        }}
        activeOpacity={0.6}
      >
        <View style={styles.conversationAvatar}>
          <Avatar uri={otherUser?.profilePicture} name={getConversationName(item)} size="lg" />
          {isOnline && (
            <View style={styles.conversationOnlineDot}>
              <View style={styles.conversationOnlineDotInner} />
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationRow}>
            <Text style={[styles.conversationName, hasUnread && styles.textBold]} numberOfLines={1}>
              {getConversationName(item)}
            </Text>
            <Text style={[styles.conversationTime, hasUnread && styles.timeUnread]}>
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>

          <View style={styles.conversationRow}>
            <Text style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]} numberOfLines={1}>
              {item.lastMessage?.sender?.id === user?.id && (
                <Text style={styles.youPrefix}>Vous: </Text>
              )}
              {item.lastMessage?.content || 'Nouvelle conversation'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {(item.unreadCount || 0) > 9 ? '9+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.newMessageButton}
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(tabs)/friends');
          }}
        >
          <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={theme.colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher"
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <View style={styles.clearButton}>
                <Ionicons name="close" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Active Users */}
      {sortedFriends && sortedFriends.length > 0 && !searchQuery && (
        <View style={styles.activeUsersSection}>
          <FlatList
            data={sortedFriends}
            renderItem={renderActiveUser}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeUsersList}
          />
        </View>
      )}

      {/* Conversations */}
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
        contentContainerStyle={[
          styles.listContent,
          (!filteredConversations || filteredConversations.length === 0) && styles.emptyList
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles" size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Aucun résultat' : 'Pas de messages'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Essayez une autre recherche'
                : 'Envoyez un message à vos amis !'}
            </Text>
          </View>
        }
      />
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
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  newMessageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Search
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Active Users
  activeUsersSection: {
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activeUsersList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  activeUserItem: {
    alignItems: 'center',
    width: 72,
  },
  activeUserAvatarWrapper: {
    position: 'relative',
  },
  activeUserGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeUserAvatarInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  activeUserAvatarOffline: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
  },
  activeUserName: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Conversations
  listContent: {
    paddingBottom: 20,
  },
  emptyList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    backgroundColor: theme.colors.surface,
  },
  conversationAvatar: {
    position: 'relative',
  },
  conversationOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationOnlineDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  conversationContent: {
    flex: 1,
    gap: 4,
  },
  conversationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  textBold: {
    fontWeight: '700',
  },
  conversationTime: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
  },
  timeUnread: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    flex: 1,
    marginRight: 8,
  },
  lastMessageUnread: {
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  youPrefix: {
    color: theme.colors.text.tertiary,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
