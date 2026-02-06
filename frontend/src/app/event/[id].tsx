import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { eventService } from '@/features/events/eventService';
import { messagingService } from '@/features/messaging/messagingService';
import { useAuth } from '@/features/auth/AuthContext';
import { Avatar } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';
import { getSportConfig, getSportLabel } from '@/constants/sports';
import { getCoverImageForSport } from '@/constants/defaultImages';
import { EventParticipant, AxiosApiError } from '@/types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5);
}

function getRecurrenceLabel(recurrence: string): string | null {
  switch (recurrence) {
    case 'DAILY': return 'Quotidien';
    case 'WEEKLY': return 'Hebdomadaire';
    case 'BIWEEKLY': return 'Bi-hebdomadaire';
    case 'MONTHLY': return 'Mensuel';
    default: return null;
  }
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEventById(id!),
    enabled: !!id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => eventService.deleteEvent(id!),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['nearbyEvents'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      Alert.alert('Succès', 'Événement supprimé', [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'événement');
    },
  });

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: () => eventService.joinEvent(id!),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['nearbyEvents'] });
    },
    onError: (error: AxiosApiError) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error?.response?.data?.message || 'Impossible de rejoindre l\'événement';
      Alert.alert('Erreur', message);
    },
  });

  // Leave mutation
  const leaveMutation = useMutation({
    mutationFn: () => eventService.leaveEvent(id!),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['nearbyEvents'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      Alert.alert('Succès', 'Vous avez quitté l\'événement');
    },
    onError: (error: AxiosApiError) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error?.response?.data?.message || 'Impossible de quitter l\'événement';
      Alert.alert('Erreur', message);
    },
  });

  const handleDelete = () => {
    Alert.alert('Supprimer', 'Êtes-vous sûr de vouloir supprimer cet événement ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    joinMutation.mutate();
  };

  const handleLeave = () => {
    Alert.alert('Quitter', 'Voulez-vous vraiment quitter cet événement ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Quitter', style: 'destructive', onPress: () => leaveMutation.mutate() },
    ]);
  };

  const handleOpenMaps = () => {
    if (event?.latitude && event?.longitude) {
      const url = `https://maps.google.com/?q=${event.latitude},${event.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleContactOrganizer = async () => {
    if (event?.organizer) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        const conversation = await messagingService.createConversation([event.organizer.id]);
        router.push(`/conversation/${conversation.id}`);
      } catch (error) {
        router.push(`/user/${event.organizer.id}`);
      }
    }
  };

  const handleViewParticipant = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/user/${userId}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>Événement introuvable</Text>
          <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sportConfig = getSportConfig(event.sport);
  const sportColor = sportConfig?.color || theme.colors.primary;
  const isOwner = currentUser?.id === event.userId;
  const recurrenceLabel = getRecurrenceLabel(event.recurrence);
  const isFull = event.maxParticipants !== undefined && event.maxParticipants !== null
    && (event.participantCount || 0) >= event.maxParticipants;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Détails</Text>
          {isOwner && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Cover Image */}
          <View style={styles.coverContainer}>
            <Image source={{ uri: getCoverImageForSport(event.sport) }} style={styles.coverImage} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.coverGradient} />
            {/* Sport Badge */}
            <View style={[styles.sportBadge, { backgroundColor: sportColor }]}>
              {sportConfig && <Ionicons name={sportConfig.icon} size={16} color="#fff" style={{ marginRight: 6 }} />}
              <Text style={styles.sportBadgeText}>{getSportLabel(event.sport)}</Text>
            </View>
            {/* Participants count on cover */}
            <View style={styles.participantsBadge}>
              <Ionicons name="people" size={14} color="#fff" />
              <Text style={styles.participantsBadgeText}>
                {event.participantCount || 0}
                {event.maxParticipants != null ? ` / ${event.maxParticipants}` : ''}
              </Text>
            </View>
            {/* Paid badge */}
            {event.isPaid && (
              <View style={styles.paidBadge}>
                <Ionicons name="cash" size={14} color="#fff" />
                <Text style={styles.paidBadgeText}>{event.price?.toFixed(0)} €</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.title}>{event.title || getSportLabel(event.sport)}</Text>

            {/* Date & Time Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{formatDate(event.date)}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="time" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Horaires</Text>
                  <Text style={styles.infoValue}>{formatTime(event.startTime)} - {formatTime(event.endTime)}</Text>
                </View>
              </View>
              {recurrenceLabel && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="repeat" size={20} color={theme.colors.primary} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Récurrence</Text>
                      <Text style={styles.infoValue}>{recurrenceLabel}</Text>
                    </View>
                  </View>
                </>
              )}
              {event.isPaid && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.success}15` }]}>
                      <Ionicons name="cash" size={20} color={theme.colors.success} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Événement payant</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.success }]}>
                        {event.price?.toFixed(2)} €
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Location */}
            {event.location && (
              <TouchableOpacity
                style={styles.infoCard}
                onPress={handleOpenMaps}
                disabled={!event.latitude || !event.longitude}
                activeOpacity={0.7}
              >
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="location" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={[styles.infoContent, { flex: 1 }]}>
                    <Text style={styles.infoLabel}>Lieu</Text>
                    <Text style={styles.infoValue}>{event.location}</Text>
                    {event.distanceKm != null && typeof event.distanceKm === 'number' && (
                      <Text style={styles.distance}>{event.distanceKm.toFixed(1)} km de vous</Text>
                    )}
                  </View>
                  {event.latitude && event.longitude && (
                    <Ionicons name="open-outline" size={18} color={theme.colors.text.tertiary} />
                  )}
                </View>
              </TouchableOpacity>
            )}

            {/* Description */}
            {event.description && (
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.descriptionText}>{event.description}</Text>
              </View>
            )}

            {/* Organizer */}
            {event.organizer && (
              <View style={styles.organizerCard}>
                <Text style={styles.sectionLabel}>Organisateur</Text>
                <TouchableOpacity
                  style={styles.organizerRow}
                  onPress={() => router.push(`/user/${event.organizer!.id}`)}
                  activeOpacity={0.7}
                >
                  <Avatar uri={event.organizer.profilePicture} name={event.organizer.fullName} size="md" />
                  <View style={styles.organizerInfo}>
                    <Text style={styles.organizerName}>{event.organizer.fullName}</Text>
                    {isOwner && <Text style={styles.youBadge}>Vous</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Participants */}
            <View style={styles.participantsCard}>
              <View style={styles.participantsHeader}>
                <Text style={styles.sectionLabel}>
                  Participants ({event.participantCount || 0}
                  {event.maxParticipants != null ? ` / ${event.maxParticipants}` : ''})
                </Text>
              </View>
              {event.participants && event.participants.length > 0 ? (
                <View style={styles.participantsList}>
                  {event.participants.map((participant: EventParticipant) => (
                    <TouchableOpacity
                      key={participant.userId}
                      style={styles.participantItem}
                      onPress={() => handleViewParticipant(participant.userId)}
                      activeOpacity={0.7}
                    >
                      <Avatar uri={participant.profilePicture} name={participant.fullName} size="sm" />
                      <Text style={styles.participantName} numberOfLines={1}>{participant.fullName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noParticipants}>
                  <Ionicons name="people-outline" size={32} color={theme.colors.text.tertiary} />
                  <Text style={styles.noParticipantsText}>Aucun participant pour le moment</Text>
                  <Text style={styles.noParticipantsSubtext}>Soyez le premier à rejoindre !</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {!isOwner && (
                <>
                  {event.isParticipating ? (
                    <TouchableOpacity
                      style={styles.leaveButton}
                      onPress={handleLeave}
                      disabled={leaveMutation.isPending}
                    >
                      {leaveMutation.isPending ? (
                        <ActivityIndicator color={theme.colors.error} />
                      ) : (
                        <>
                          <Ionicons name="exit-outline" size={20} color={theme.colors.error} />
                          <Text style={styles.leaveButtonText}>Quitter l'événement</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.joinButton, isFull && styles.joinButtonDisabled]}
                      onPress={handleJoin}
                      disabled={joinMutation.isPending || isFull}
                    >
                      {joinMutation.isPending ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="add-circle-outline" size={20} color="#fff" />
                          <Text style={styles.joinButtonText}>
                            {isFull ? 'Complet' : 'Participer'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.contactButton} onPress={handleContactOrganizer}>
                    <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.contactButtonText}>Contacter</Text>
                  </TouchableOpacity>
                </>
              )}
              {isOwner && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => router.push(`/event/edit/${id}`)}
                >
                  <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.editButtonText}>Modifier l'événement</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.surface },
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.md },
  errorText: { fontSize: theme.typography.size.lg, color: theme.colors.text.secondary },
  backButtonLarge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  backButtonText: { color: theme.colors.text.inverse, fontWeight: theme.typography.weight.semibold },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  deleteButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  coverContainer: { height: 220, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  sportBadge: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
  },
  sportBadgeText: { color: '#fff', fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold },
  participantsBadge: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    gap: 4,
  },
  participantsBadgeText: { color: '#fff', fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.medium },
  paidBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    gap: 4,
  },
  paidBadgeText: { color: '#fff', fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold },
  content: { padding: theme.spacing.md },
  title: {
    fontSize: 24,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center', alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weight.medium,
    marginTop: 2,
  },
  distance: { fontSize: theme.typography.size.sm, color: theme.colors.primary, marginTop: 2 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.sm },
  descriptionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  descriptionLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  descriptionText: { fontSize: theme.typography.size.md, color: theme.colors.text.secondary, lineHeight: 22 },
  organizerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  sectionLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  organizerRow: { flexDirection: 'row', alignItems: 'center' },
  organizerInfo: { flex: 1, marginLeft: theme.spacing.md },
  organizerName: { fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold, color: theme.colors.text.primary },
  youBadge: { fontSize: theme.typography.size.xs, color: theme.colors.primary, marginTop: 2 },
  participantsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  participantsHeader: { marginBottom: theme.spacing.sm },
  participantsList: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    gap: theme.spacing.xs,
  },
  participantName: { fontSize: theme.typography.size.sm, color: theme.colors.text.primary, maxWidth: 100 },
  noParticipants: { alignItems: 'center', paddingVertical: theme.spacing.lg },
  noParticipantsText: { fontSize: theme.typography.size.md, color: theme.colors.text.secondary, marginTop: theme.spacing.sm },
  noParticipantsSubtext: { fontSize: theme.typography.size.sm, color: theme.colors.text.tertiary, marginTop: 4 },
  actionButtons: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  joinButtonDisabled: { backgroundColor: theme.colors.text.tertiary },
  joinButtonText: { color: '#fff', fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${theme.colors.error}15`,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  leaveButtonText: { color: theme.colors.error, fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  contactButtonText: { color: theme.colors.primary, fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  editButtonText: { color: theme.colors.primary, fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold },
  bottomSpacer: { height: theme.spacing.xxl },
});
