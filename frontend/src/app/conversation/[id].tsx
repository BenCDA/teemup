import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { messagingService } from '@/features/messaging/messagingService';
import socketService from '@/features/shared/socket';
import { Message, User } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';

export default function ConversationScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => messagingService.getConversation(conversationId!),
    enabled: !!conversationId,
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messagingService.getMessages(conversationId!),
    enabled: !!conversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => messagingService.sendMessage(conversationId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  useEffect(() => {
    if (messagesData?.content) {
      setMessages([...messagesData.content].reverse());
    }
  }, [messagesData]);

  useEffect(() => {
    if (!conversationId) return;

    socketService.joinConversation(conversationId);
    messagingService.markAsRead(conversationId);

    const unsubNewMessage = socketService.on('newMessage', (newMessage: Message) => {
      if (newMessage.conversationId === conversationId) {
        setMessages(prev => [...prev, newMessage]);
        socketService.markAsRead(conversationId);
      }
    });

    const unsubTyping = socketService.on('userTyping', (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setTypingUsers(prev => [...new Set([...prev, data.userId])]);
      }
    });

    const unsubStopTyping = socketService.on('userStoppedTyping', (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    });

    return () => {
      socketService.leaveConversation(conversationId);
      unsubNewMessage();
      unsubTyping();
      unsubStopTyping();
    };
  }, [conversationId, user?.id]);

  const handleSend = useCallback(() => {
    if (!message.trim()) return;

    const content = message.trim();
    setMessage('');

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      sender: user as User,
      conversationId: conversationId!,
      type: 'TEXT',
      readBy: [user!.id],
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);

    // Send via REST (reliable)
    sendMessageMutation.mutate(content);

    // Also send via WebSocket for real-time
    socketService.sendMessage(conversationId!, content);
    socketService.stopTyping(conversationId!);
  }, [message, conversationId, user, sendMessageMutation]);

  const handleTyping = useCallback((text: string) => {
    setMessage(text);

    if (text.trim()) {
      socketService.startTyping(conversationId!);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(conversationId!);
      }, 2000);
    } else {
      socketService.stopTyping(conversationId!);
    }
  }, [conversationId]);

  const getConversationTitle = (): string => {
    if (!conversation) return 'Conversation';
    if (conversation.name) return conversation.name;
    if (conversation.type === 'PRIVATE') {
      const otherUser = conversation.participants.find(p => p.id !== user?.id);
      return otherUser?.fullName || 'Conversation';
    }
    return 'Groupe';
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.sender.id === user?.id;
    const showAvatar = index === 0 || messages[index - 1]?.sender.id !== item.sender.id;

    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        {!isOwnMessage && showAvatar && (
          <View style={styles.messageAvatar}>
            <Text style={styles.messageAvatarText}>
              {item.sender.firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {!isOwnMessage && !showAvatar && <View style={styles.avatarPlaceholder} />}

        <View style={[styles.messageBubble, isOwnMessage && styles.ownMessageBubble]}>
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const isLoading = conversationLoading || messagesLoading;

  return (
    <>
      <Stack.Screen
        options={{
          title: getConversationTitle(),
          headerStyle: { backgroundColor: '#4F46E5' },
          headerTintColor: '#fff',
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
              onLayout={() => flatListRef.current?.scrollToEnd()}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Aucun message</Text>
                  <Text style={styles.emptySubtext}>Envoyez le premier message !</Text>
                </View>
              }
            />
          )}

          {typingUsers.length > 0 && (
            <View style={styles.typingIndicator}>
              <Text style={styles.typingText}>En train d'écrire...</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Écrivez un message..."
              placeholderTextColor="#9CA3AF"
              value={message}
              onChangeText={handleTyping}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!message.trim() || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  avatarPlaceholder: {
    width: 40,
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ownMessageBubble: {
    backgroundColor: '#4F46E5',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
