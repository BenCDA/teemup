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
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { messagingService } from '@/features/messaging/messagingService';
import { Conversation, User } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { theme } from '@/features/shared/styles/theme';

export default function MessagesScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagingService.getConversations,
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
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherUser(item);

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => router.push(`/conversation/${item.id}`)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getConversationName(item).charAt(0).toUpperCase()}
          </Text>
          {otherUser?.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {getConversationName(item)}
            </Text>
            <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
          </View>

          <View style={styles.conversationFooter}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage?.content || 'Aucun message'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
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
      <FlatList
        data={conversations}
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
        contentContainerStyle={conversations?.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContent}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.border} />
            <Text style={styles.emptyText}>Aucune conversation</Text>
            <Text style={styles.emptySubtext}>
              Commencez à discuter avec vos amis !
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
    backgroundColor: theme.colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.semibold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  conversationName: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  time: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
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
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
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
