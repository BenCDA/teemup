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
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Assure-toi que ces imports pointent vers tes fichiers corrects
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
  
  // États
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
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

    const unsubNewMessage = socketService.on('newMessage', handleNewMessage);
    const unsubTyping = socketService.on('userTyping', handleUserTyping);
    const unsubStopTyping = socketService.on('userStoppedTyping', handleUserStoppedTyping);

    return () => {
      socketService.leaveConversation(conversationId);
      unsubNewMessage();
      unsubTyping();
      unsubStopTyping();
      typingTimeoutsRef.current.forEach(clearTimeout);
      typingTimeoutsRef.current.clear();
    };
  }, [conversationId, user]);

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
          <View>
            <Avatar uri={otherUser?.profilePicture} name={title} size="md" />
            {otherUser?.isOnline && <View style={styles.onlineBadge} />}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.headerSubtitle}>
              {otherUser?.isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          {/* Boutons appel/vidéo supprimés */}
        </View>
      </View>

      {/* SOCKET STATUS */}
      {socketStatus !== 'connected' && (
        <View style={[styles.statusBanner, socketStatus === 'error' && styles.statusBannerError]}>
          <Text style={styles.statusText}>{socketStatus === 'connecting' ? 'Connexion...' : 'Hors ligne'}</Text>
        </View>
      )}

      {/* CHAT AREA */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
            inverted={true} /* C'est ICI que la magie opère */
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            ListEmptyComponent={
              <View style={[styles.emptyContainer, { transform: [{ scaleY: -1 }] }]}>
                 {/* On inverse le composant vide car la liste est inversée */}
                 <View style={styles.emptyIconCircle}>
                    <Ionicons name="chatbubbles-outline" size={40} color={theme.colors.primary} />
                 </View>
                 <Text style={styles.emptyTitle}>Dites bonjour !</Text>
              </View>
            }
          />
        )}

        {/* TYPING INDICATOR */}
        {typingUsers.length > 0 && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>Quelqu'un écrit</Text>
            <Animated.View style={{ opacity: typingDotsAnim, marginLeft: 2 }}>
               <Text style={styles.typingText}>...</Text>
            </Animated.View>
          </View>
        )}

        {/* INPUT BAR */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Message..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={message}
            onChangeText={handleTyping}
            multiline
            maxLength={2000}
          />
          
          {message.trim().length > 0 ? (
             <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sendMessageMutation.isPending}>
               {sendMessageMutation.isPending ? (
                 <ActivityIndicator size="small" color="#fff" />
               ) : (
                 <Ionicons name="arrow-up" size={20} color="#fff" />
               )}
             </TouchableOpacity>
          ) : (
             <TouchableOpacity style={styles.micButton}>
               <Ionicons name="mic-outline" size={24} color={theme.colors.primary} />
             </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==============================================================================
// 3. STYLES
// ==============================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  
  // Header
  header: { 
    flexDirection: 'row', alignItems: 'center', padding: 8, 
    backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border 
  },
  backButton: { padding: 4 },
  headerProfile: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  headerInfo: { marginLeft: 10, flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
  headerSubtitle: { fontSize: 12, color: theme.colors.success },
  headerActions: { flexDirection: 'row' },
  headerActionIcon: { padding: 8 },
  onlineBadge: { 
    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, 
    borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: theme.colors.surface 
  },
  
  // Status
  statusBanner: { backgroundColor: '#F59E0B', padding: 4, alignItems: 'center' },
  statusBannerError: { backgroundColor: '#EF4444' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  
  // List
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { paddingHorizontal: 12, paddingVertical: 10 },
  messageWrapper: { marginVertical: 1 }, // Wrapper simple, pas de transform ici !

  // Message Row
  messageRow: { flexDirection: 'row', marginVertical: 2, alignItems: 'flex-end' },
  messageRowOwn: { justifyContent: 'flex-end' },
  
  // Avatars
  avatarColumn: { width: 36, marginRight: 8 },
  avatarPlaceholder: { width: 36 },
  
  // Bubbles
  bubbleContainer: { maxWidth: '75%' },
  bubbleContainerOwn: { alignItems: 'flex-end' },
  
  bubble: { 
    borderRadius: 18, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    minWidth: 40
  },
  bubbleOwn: { 
    backgroundColor: theme.colors.primary, 
    borderBottomRightRadius: 4 // Par défaut le dernier message a un coin un peu plus carré
  },
  bubbleOther: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4
  },
  
  // Gestion des coins pour les groupes de messages
  bubbleNotLastOwn: { borderBottomRightRadius: 18, marginBottom: 1 },
  bubbleNotLastOther: { borderBottomLeftRadius: 18, marginBottom: 1 },
  bubbleOptimistic: { opacity: 0.7 },
  
  // Text
  messageText: { fontSize: 15, color: theme.colors.text.primary, lineHeight: 21 },
  messageTextOwn: { fontSize: 15, color: '#fff', lineHeight: 21 },
  
  // Metadata (Time + Check)
  messageMetaOwn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2, gap: 4 },
  timeText: { fontSize: 10, color: theme.colors.text.tertiary, alignSelf: 'flex-end', marginTop: 4, marginLeft: 4 },
  timeTextOwn: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  readIcon: { marginLeft: 0 },

  // Date Separator
  dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dateLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dateText: { marginHorizontal: 10, fontSize: 12, color: theme.colors.text.tertiary, fontWeight: '500' },

  // Input Area
  inputContainer: { 
    flexDirection: 'row', alignItems: 'flex-end', padding: 8, paddingBottom: 8,
    borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface 
  },
  textInput: { 
    flex: 1, backgroundColor: theme.colors.background, borderRadius: 20, 
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, marginHorizontal: 8, maxHeight: 100,
    fontSize: 15, color: theme.colors.text.primary
  },
  sendButton: { 
    width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary, 
    alignItems: 'center', justifyContent: 'center', marginBottom: 2 
  },
  attachButton: { marginBottom: 5, padding: 4 },
  micButton: { marginBottom: 5, padding: 4 },
  
  // Typing
  typingContainer: { 
    paddingHorizontal: 20, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', 
    position: 'absolute', bottom: 60, left: 0, right: 0, // Positionnement absolu pour flotter au dessus
    backgroundColor: 'transparent'
  },
  typingText: { fontSize: 12, color: theme.colors.text.tertiary, fontStyle: 'italic' },
  
  // Empty State
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { color: theme.colors.text.secondary, fontSize: 16, fontWeight: '500' },
});