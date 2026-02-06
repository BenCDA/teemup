import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  Alert,
  Animated,
  ListRenderItem,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { messagingService } from '@/features/messaging/messagingService';
import socketService from '@/features/shared/socket';
import { useSocketStatus } from '@/features/shared/useSocketStatus';
import { Message, User } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Avatar } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';

// ==============================================================================
// 1. COMPOSANT MESSAGE (Optimisé & Sans Miroir)
// ==============================================================================
const MessageItem = React.memo(({ 
  item, 
  prevItem, 
  nextItem, 
  userId 
}: { 
  item: Message; 
  prevItem?: Message; 
  nextItem?: Message; 
  userId?: string 
}) => {
  const isOwnMessage = item.sender.id === userId;
  const isOptimistic = item.id.startsWith('temp-');

  // Logique d'affichage pour liste inversée :
  // nextItem = Message plus VIEUX (en haut visuellement, ou page suivante)
  // prevItem = Message plus RÉCENT (en bas visuellement)

  // On groupe les messages : Si le message plus récent (prevItem) est du même user, on ne redessine pas l'avatar
  // Note: Dans une liste inversée, l'avatar se met généralement sur le dernier message du groupe (le plus récent, donc index le plus bas)
  const isLastInSequence = !prevItem || prevItem.sender.id !== item.sender.id;
  const showAvatar = !isOwnMessage && isLastInSequence;

  // Séparateur de date : On compare avec le message SUIVANT (plus vieux)
  // Si la date change par rapport au message précédent dans l'historique, on affiche le séparateur
  const shouldShowDateSeparator = useMemo(() => {
    if (!nextItem) return true; // Premier message de l'histoire
    const currentDate = new Date(item.createdAt).toDateString();
    const prevDate = new Date(nextItem.createdAt).toDateString();
    return currentDate !== prevDate;
  }, [item.createdAt, nextItem?.createdAt]);

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const d1 = new Date(date.setHours(0,0,0,0));
    const d2 = new Date(now.setHours(0,0,0,0));
    const diffDays = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.messageWrapper}>
      {/* Date Separator (Affiché "au dessus" du message) */}
      {shouldShowDateSeparator && (
        <View style={styles.dateSeparator}>
          <View style={styles.dateLine} />
          <Text style={styles.dateText}>{formatDateSeparator(item.createdAt)}</Text>
          <View style={styles.dateLine} />
        </View>
      )}

      <View style={[styles.messageRow, isOwnMessage && styles.messageRowOwn]}>
        {!isOwnMessage && (
          <View style={styles.avatarColumn}>
            {showAvatar ? (
              <Avatar uri={item.sender.profilePicture} name={item.sender.fullName} size="sm" />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
          </View>
        )}

        <View style={[styles.bubbleContainer, isOwnMessage && styles.bubbleContainerOwn]}>
          {isOwnMessage ? (
            <LinearGradient
              colors={[theme.colors.primary, '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.bubble,
                styles.bubbleOwn,
                !isLastInSequence && styles.bubbleNotLastOwn,
                isOptimistic && styles.bubbleOptimistic,
              ]}
            >
              <Text style={styles.messageTextOwn}>{item.content}</Text>
              <View style={styles.messageMetaOwn}>
                <Text style={styles.timeTextOwn}>{formatTime(item.createdAt)}</Text>
                <Ionicons
                  name={isOptimistic ? "time-outline" : "checkmark-done"}
                  size={isOptimistic ? 12 : 14}
                  color={`rgba(255,255,255,${isOptimistic ? 0.5 : 0.7})`}
                  style={styles.readIcon}
                />
              </View>
            </LinearGradient>
          ) : (
            <View style={[styles.bubble, styles.bubbleOther, !isLastInSequence && styles.bubbleNotLastOther]}>
              <Text style={styles.messageText}>{item.content}</Text>
              <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

// ==============================================================================
// 2. ÉCRAN PRINCIPAL
// ==============================================================================
export default function ConversationScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const socketStatus = useSocketStatus();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  // États
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState<boolean | null>(null);
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const typingDotsAnim = useRef(new Animated.Value(0)).current;

  // Chargement Conversation Info
  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => messagingService.getConversation(conversationId!),
    enabled: !!conversationId,
  });

  // Chargement Messages
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messagingService.getMessages(conversationId!),
    enabled: !!conversationId,
  });

  // INITIALISATION : L'API renvoie déjà [Récent -> Vieux] (ORDER BY createdAt DESC)
  // Parfait pour une FlatList inverted où index 0 = bas de l'écran
  useEffect(() => {
    if (messagesData?.content) {
      setMessages(messagesData.content);
    }
  }, [messagesData]);

  // Mutation envoi message
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => messagingService.sendMessage(conversationId!, content),
    onSuccess: (savedMessage) => {
      setMessages(prev => {
        // Remplacer le message temporaire par le réel
        return prev.map(m => 
          (m.id.startsWith('temp-') && m.content === savedMessage.content) 
            ? savedMessage 
            : m
        );
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] }); 
    },
    onError: (_, content) => {
      // Supprimer le message temporaire en cas d'erreur
      setMessages(prev => prev.filter(m => !(m.id.startsWith('temp-') && m.content === content)));
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    },
  });

  // SOCKET MANAGEMENT
  useEffect(() => {
    if (!conversationId || !user) return;

    socketService.joinConversation(conversationId);
    messagingService.markAsRead(conversationId);

    const handleNewMessage = (newMessage: Message) => {
      if (newMessage.conversationId !== conversationId) return;

      setMessages(prev => {
        // 1. Anti-doublon
        if (prev.some(m => m.id === newMessage.id)) return prev;

        // 2. Gestion Optimistic Update (collision avec socket)
        const optimisticIndex = prev.findIndex(m => 
          m.id.startsWith('temp-') && 
          m.content === newMessage.content && 
          m.sender.id === newMessage.sender.id
        );

        if (optimisticIndex !== -1) {
          const newArr = [...prev];
          newArr[optimisticIndex] = newMessage;
          return newArr;
        }

        // 3. AJOUT EN TÊTE (Index 0 = Bas de l'écran)
        return [newMessage, ...prev];
      });
      
      socketService.markAsRead(conversationId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleUserTyping = ({ userId, conversationId: convId }: { userId: string; conversationId: string }) => {
      if (convId !== conversationId || userId === user.id) return;
      
      setTypingUsers(prev => {
        if (prev.includes(userId)) return prev;
        return [...prev, userId];
      });

      // Cleanup précédent
      if (typingTimeoutsRef.current.has(userId)) {
        clearTimeout(typingTimeoutsRef.current.get(userId)!);
      }

      // Auto-stop typing après 5s de sécurité
      const timeout = setTimeout(() => {
        setTypingUsers(prev => prev.filter(id => id !== userId));
        typingTimeoutsRef.current.delete(userId);
      }, 5000);
      
      typingTimeoutsRef.current.set(userId, timeout);
    };

    const handleUserStoppedTyping = ({ userId, conversationId: convId }: { userId: string; conversationId: string }) => {
      if (convId !== conversationId) return;
      setTypingUsers(prev => prev.filter(id => id !== userId));
      if (typingTimeoutsRef.current.has(userId)) {
        clearTimeout(typingTimeoutsRef.current.get(userId)!);
        typingTimeoutsRef.current.delete(userId);
      }
    };

    const handleUserOnline = ({ userId: onlineUserId }: { userId: string }) => {
      if (otherUser && onlineUserId === otherUser.id) {
        setOtherUserOnline(true);
      }
    };

    const handleUserOffline = ({ userId: offlineUserId }: { userId: string }) => {
      if (otherUser && offlineUserId === otherUser.id) {
        setOtherUserOnline(false);
      }
    };

    const unsubNewMessage = socketService.on('newMessage', handleNewMessage);
    const unsubTyping = socketService.on('userTyping', handleUserTyping);
    const unsubStopTyping = socketService.on('userStoppedTyping', handleUserStoppedTyping);
    const unsubOnline = socketService.on('userOnline', handleUserOnline);
    const unsubOffline = socketService.on('userOffline', handleUserOffline);

    return () => {
      socketService.leaveConversation(conversationId);
      unsubNewMessage();
      unsubTyping();
      unsubStopTyping();
      unsubOnline();
      unsubOffline();
      typingTimeoutsRef.current.forEach(clearTimeout);
      typingTimeoutsRef.current.clear();
    };
  }, [conversationId, user]);

  // Keyboard listener
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Animation Typing
  useEffect(() => {
    if (typingUsers.length === 0) {
      typingDotsAnim.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(typingDotsAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(typingDotsAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [typingUsers.length]);

  // Handler Envoi
  const handleSend = useCallback(() => {
    if (!message.trim() || !user || !conversationId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const content = message.trim();
    setMessage('');

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      sender: user as User,
      conversationId,
      type: 'TEXT',
      readBy: [user.id],
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Ajout immédiat en TÊTE de liste (Index 0)
    setMessages(prev => [optimisticMessage, ...prev]);
    sendMessageMutation.mutate(content);
    socketService.stopTyping(conversationId);
  }, [message, conversationId, user, sendMessageMutation]);

  // Handler Typing
  const handleTyping = useCallback((text: string) => {
    setMessage(text);
    if (!conversationId) return;

    if (text.trim()) {
      socketService.startTyping(conversationId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(conversationId);
      }, 2000);
    } else {
      socketService.stopTyping(conversationId);
    }
  }, [conversationId]);

  // Render Item Helper
  const renderItem: ListRenderItem<Message> = useCallback(({ item, index }) => {
    // nextItem = le message suivant dans le tableau (donc chronologiquement plus vieux)
    const nextItem = messages[index + 1]; 
    // prevItem = le message précédent dans le tableau (donc chronologiquement plus récent)
    const prevItem = messages[index - 1]; 
    
    return (
      <MessageItem 
        item={item} 
        prevItem={prevItem} 
        nextItem={nextItem} 
        userId={user?.id} 
      />
    );
  }, [messages, user?.id]);

  // Header Info
  const getOtherUser = () => {
    if (conversation?.type === 'PRIVATE') {
      return conversation.participants.find(p => p.id !== user?.id);
    }
    return undefined;
  };
  const otherUser = getOtherUser();
  const title = conversation?.name || otherUser?.fullName || 'Discussion';
  // Real-time status takes priority, fallback to API snapshot
  const isOnline = otherUserOnline ?? otherUser?.isOnline ?? false;

  // Calcul du padding bottom pour la zone d'input
  const inputBottomPadding = keyboardVisible ? 0 : Math.max(insets.bottom, 8);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerProfile}
          activeOpacity={0.7}
          onPress={() => otherUser && router.push(`/user/${otherUser.id}`)}
        >
          <View style={styles.headerAvatarWrapper}>
            <Avatar uri={otherUser?.profilePicture} name={title} size="md" />
            {isOnline && <View style={styles.onlineBadge} />}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            <Text style={[styles.headerSubtitle, !isOnline && styles.headerSubtitleOffline]}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerActionIcon}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* SOCKET STATUS */}
      {socketStatus !== 'connected' && (
        <View style={[styles.statusBanner, socketStatus === 'error' && styles.statusBannerError]}>
          <Ionicons
            name={socketStatus === 'connecting' ? 'sync' : 'cloud-offline'}
            size={14}
            color="#fff"
          />
          <Text style={styles.statusText}>
            {socketStatus === 'connecting' ? 'Connexion...' : 'Hors ligne'}
          </Text>
        </View>
      )}

      {/* CHAT AREA */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
      >
        {messagesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.messagesListEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="chatbubbles-outline" size={40} color={theme.colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Dites bonjour !</Text>
                <Text style={styles.emptySubtitle}>Envoyez un message pour démarrer la conversation</Text>
              </View>
            }
          />
        )}

        {/* TYPING INDICATOR */}
        {typingUsers.length > 0 && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>En train d'écrire</Text>
              <Animated.View style={{ opacity: typingDotsAnim }}>
                <Text style={styles.typingDots}>...</Text>
              </Animated.View>
            </View>
          </View>
        )}

        {/* INPUT BAR */}
        <View style={[styles.inputContainer, { paddingBottom: inputBottomPadding }]}>
          <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
            <View style={styles.attachButtonInner}>
              <Ionicons name="add" size={24} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>

          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Message..."
              placeholderTextColor={theme.colors.text.tertiary}
              value={message}
              onChangeText={handleTyping}
              multiline
              maxLength={2000}
            />
          </View>

          {message.trim().length > 0 ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={sendMessageMutation.isPending}
              activeOpacity={0.8}
            >
              {sendMessageMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micButton} activeOpacity={0.7}>
              <Ionicons name="mic-outline" size={24} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ==============================================================================
// 3. STYLES
// ==============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  chatArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerAvatarWrapper: {
    position: 'relative',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#22C55E',
    marginTop: 1,
  },
  headerSubtitleOffline: {
    color: theme.colors.text.tertiary,
  },
  headerActionIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },

  // Status Banner
  statusBanner: {
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusBannerError: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // List
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  messagesListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  messageWrapper: {
    marginVertical: 1,
  },

  // Message Row
  messageRow: {
    flexDirection: 'row',
    marginVertical: 2,
    alignItems: 'flex-end',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },

  // Avatars
  avatarColumn: {
    width: 32,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
  },

  // Bubbles
  bubbleContainer: {
    maxWidth: '78%',
  },
  bubbleContainerOwn: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 44,
  },
  bubbleOwn: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 6,
  },
  bubbleNotLastOwn: {
    borderBottomRightRadius: 20,
    marginBottom: 2,
  },
  bubbleNotLastOther: {
    borderBottomLeftRadius: 20,
    marginBottom: 2,
  },
  bubbleOptimistic: {
    opacity: 0.7,
  },

  // Text
  messageText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  messageTextOwn: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },

  // Metadata
  messageMetaOwn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  timeTextOwn: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  readIcon: {
    marginLeft: 0,
  },

  // Date Separator
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dateText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },

  // Input Area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 8,
  },
  attachButton: {
    marginBottom: 6,
  },
  attachButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  micButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  // Typing Indicator
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    alignSelf: 'flex-start',
    maxWidth: 160,
  },
  typingText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  typingDots: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    fontWeight: '700',
    marginLeft: 2,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    transform: [{ scaleY: -1 }],
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});