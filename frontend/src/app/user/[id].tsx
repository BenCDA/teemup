import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { userService } from '@/features/user/userService';
import { friendService } from '@/features/friends/friendService';
import { messagingService } from '@/features/messaging/messagingService';
import { useAuth } from '@/features/auth/AuthContext';
import { Avatar, SportBadge, ProBadge } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';
import { User, SportEvent, AxiosApiError } from '@/types';
import { getSportConfig, getSportLabel, getSportKey } from '@/constants/sports';
import { getUserCoverImage, getCoverImageForSport } from '@/constants/defaultImages';

const HEADER_HEIGHT = 180;
const AVATAR_SIZE = 100;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUserById(id!),
    enabled: !!id,
  });

  const { data: friends } = useQuery({
    queryKey: ['userFriends', id],
    queryFn: () => userService.getUserFriends(id!),
    enabled: !!id,
  });

  const { data: events } = useQuery({
    queryKey: ['userEvents', id],
    queryFn: () => userService.getUserEvents(id!),
    enabled: !!id,
  });

  const { data: myFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: friendService.getFriends,
  });

  const isFriend = myFriends?.some(f => f.id === id);
  const isOwnProfile = currentUser?.id === id;

  const sendRequestMutation = useMutation({
    mutationFn: friendService.sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      Alert.alert('Succès', 'Demande d\'ami envoyée !');
    },
    onError: (error: AxiosApiError) => {
      Alert.alert('Erreur', error.response?.data?.message || 'Une erreur est survenue');
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: friendService.removeFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      Alert.alert('Succès', 'Ami retiré');
    },
    onError: (error: AxiosApiError) => {
      Alert.alert('Erreur', error.response?.data?.message || 'Une erreur est survenue');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['user', id] }),
      queryClient.invalidateQueries({ queryKey: ['userFriends', id] }),
      queryClient.invalidateQueries({ queryKey: ['userEvents', id] }),
    ]);
    setRefreshing(false);
  }, [id, queryClient]);

  const handleAddOrRemoveFriend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFriend) {
      Alert.alert(
        'Retirer des amis',
        `Voulez-vous retirer ${user?.firstName} de vos amis ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Retirer', style: 'destructive', onPress: () => removeFriendMutation.mutate(id!) },
        ]
      );
    } else {
      sendRequestMutation.mutate(id!);
    }
  };

  const handleMessage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const conversation = await messagingService.createConversation([id!]);
      router.push(`/conversation/${conversation.id}`);
    } catch {
      Alert.alert('Erreur', 'Impossible de démarrer la conversation');
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const formatTime = (timeString: string): string => {
    return timeString.substring(0, 5);
  };

  const formatRecurrence = (recurrence: string): string => {
    switch (recurrence) {
      case 'DAILY': return 'tous les jours';
      case 'WEEKLY': return 'chaque semaine';
      case 'BIWEEKLY': return 'toutes les 2 semaines';
      case 'MONTHLY': return 'chaque mois';
      default: return '';
    }
  };

  // Group events by sport
  const eventsBySport = events?.reduce((acc, event) => {
    if (!acc[event.sport]) {
      acc[event.sport] = [];
    }
    acc[event.sport].push(event);
    return acc;
  }, {} as Record<string, SportEvent[]>) || {};

  if (userLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Utilisateur non trouvé</Text>
      </View>
    );
  }

  const renderFriendAvatar = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.friendAvatarContainer}
      onPress={() => router.push(`/user/${item.id}`)}
    >
      <Avatar
        uri={item.profilePicture}
        name={item.fullName}
        size="md"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Cover Header */}
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: getUserCoverImage(user) }}
            style={styles.coverImage}
            resizeMode="cover"
          />

          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 8 }]}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={user.profilePicture}
              name={user.fullName}
              size="xl"
              style={styles.avatar}
            />
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{user.fullName}</Text>
            {user.isPro && <ProBadge size="sm" />}
          </View>
          {user.bio && <Text style={styles.userBio}>{user.bio}</Text>}
        </View>

        {/* Sports Section */}
        {user.sports && user.sports.length > 0 && (
          <View style={styles.sportsSection}>
            {user.sports.map((sport, index) => (
              <SportBadge key={index} sport={sport} size="md" showLabel />
            ))}
          </View>
        )}

        {/* Action Buttons - Hide for own profile */}
        {!isOwnProfile && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.friendButton, isFriend && styles.removeFriendButton]}
              onPress={handleAddOrRemoveFriend}
              disabled={sendRequestMutation.isPending || removeFriendMutation.isPending}
            >
              {(sendRequestMutation.isPending || removeFriendMutation.isPending) ? (
                <ActivityIndicator size="small" color={isFriend ? theme.colors.error : theme.colors.text.primary} />
              ) : (
                <Text style={[styles.friendButtonText, isFriend && styles.removeFriendButtonText]}>
                  {isFriend ? 'Retirer des amis' : 'Ajouter en ami'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Only show message button if already friends */}
            {isFriend && (
              <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
                <Ionicons name="chatbubble" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Own profile - Show edit button */}
        {isOwnProfile && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.editProfileButtonText}>Modifier mon profil</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Friends Section */}
        {friends && friends.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amis</Text>
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

        {/* Sports & Schedules Section */}
        {Object.keys(eventsBySport).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sport et horaires</Text>

            {Object.entries(eventsBySport).map(([sport, sportEvents]) => (
              <View key={sport} style={styles.sportCard}>
                <View style={styles.sportImageContainer}>
                  <Image
                    source={{ uri: getCoverImageForSport(sport) }}
                    style={styles.sportImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.sportInfo}>
                  <Text style={styles.sportName}>{getSportLabel(sport)}</Text>
                  {sportEvents.map((event) => (
                    <View key={event.id} style={styles.scheduleRow}>
                      <Text style={styles.scheduleDate}>
                        {event.recurrence !== 'NONE'
                          ? formatRecurrence(event.recurrence)
                          : formatDate(event.date)}
                      </Text>
                      <Text style={styles.scheduleTime}>
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state for events */}
        {Object.keys(eventsBySport).length === 0 && (
          <View style={styles.emptyEvents}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.border} />
            <Text style={styles.emptyText}>Aucun événement sportif</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    fontSize: theme.typography.size.lg,
    color: theme.colors.text.secondary,
  },
  headerContainer: {
    height: HEADER_HEIGHT + AVATAR_SIZE / 2,
    position: 'relative',
  },
  wave: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...theme.shadows.sm,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -AVATAR_SIZE / 2,
    zIndex: 10,
  },
  avatar: {
    borderWidth: 4,
    borderColor: theme.colors.surface,
  },
  userInfo: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.xs,
  },
  userName: {
    fontSize: 24,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary,
  },
  userBio: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  sportsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  friendButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  removeFriendButton: {
    backgroundColor: `${theme.colors.error}15`,
  },
  friendButtonText: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
  },
  removeFriendButtonText: {
    color: theme.colors.error,
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  editProfileButtonText: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.primary,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  friendsList: {
    gap: theme.spacing.sm,
  },
  friendAvatarContainer: {
    alignItems: 'center',
  },
  sportCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  sportImageContainer: {
    width: 100,
    height: 100,
  },
  sportImage: {
    width: '100%',
    height: '100%',
  },
  sportInfo: {
    flex: 1,
    padding: theme.spacing.md,
  },
  sportName: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scheduleDate: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.primary,
    flex: 1,
  },
  scheduleTime: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
  },
  emptyEvents: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.md,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});
