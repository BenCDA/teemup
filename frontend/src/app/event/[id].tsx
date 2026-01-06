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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eventService } from '@/features/events/eventService';
import { api } from '@/features/shared/api';
import { useAuth } from '@/features/auth/AuthContext';
import { Avatar } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';
import { getSportConfig, getSportLabel, getSportKey } from '@/constants/sports';
import { User } from '@/types';

const sportCoverImages: Record<string, string> = {
  running: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=400&fit=crop',
  swimming: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=400&fit=crop',
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=400&fit=crop',
  football: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=400&fit=crop',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop',
  cycling: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&h=400&fit=crop',
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop',
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop',
  boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&h=400&fit=crop',
  hiking: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=400&fit=crop',
};

const defaultCover = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=400&fit=crop';

function getCoverImage(sport: string): string {
  const sportKey = getSportKey(sport);
  return sportCoverImages[sportKey] || defaultCover;
}

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
    case 'DAILY':
      return 'Quotidien';
    case 'WEEKLY':
      return 'Hebdomadaire';
    case 'BIWEEKLY':
      return 'Bi-hebdomadaire';
    case 'MONTHLY':
      return 'Mensuel';
    default:
      return null;
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
  } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEventById(id!),
    enabled: !!id,
  });

  // Fetch organizer info
  const { data: organizer } = useQuery({
    queryKey: ['user', event?.userId],
    queryFn: async () => {
      const response = await api.get<User>(`/users/${event?.userId}`);
      return response.data;
    },
    enabled: !!event?.userId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => eventService.deleteEvent(id!),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['nearbyEvents'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      Alert.alert('Succes', 'Evenement supprime', [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'evenement');
    },
  });

  const handleDelete = () => {
    Alert.alert('Supprimer', 'Etes-vous sur de vouloir supprimer cet evenement ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  const handleOpenMaps = () => {
    if (event?.latitude && event?.longitude) {
      const url = `https://maps.google.com/?q=${event.latitude},${event.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleContactOrganizer = () => {
    if (organizer) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/user/${organizer.id}`);
    }
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
          <Text style={styles.errorText}>Evenement introuvable</Text>
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          {isOwner && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Cover Image */}
          <View style={styles.coverContainer}>
            <Image
              source={{ uri: getCoverImage(event.sport) }}
              style={styles.coverImage}
              resizeMode="cover"
            />
            {/* Sport Badge */}
            <View style={[styles.sportBadge, { backgroundColor: sportColor }]}>
              {sportConfig && (
                <Ionicons name={sportConfig.icon} size={16} color="#fff" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.sportBadgeText}>{getSportLabel(event.sport)}</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.title}>{event.title || getSportLabel(event.sport)}</Text>

            {/* Date & Time */}
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
                  <Text style={styles.infoValue}>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </Text>
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
                      <Text style={styles.infoLabel}>Recurrence</Text>
                      <Text style={styles.infoValue}>{recurrenceLabel}</Text>
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
                    {event.distanceKm !== undefined && (
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
            {organizer && (
              <View style={styles.organizerCard}>
                <Text style={styles.organizerLabel}>Organise par</Text>
                <TouchableOpacity
                  style={styles.organizerRow}
                  onPress={handleContactOrganizer}
                  activeOpacity={0.7}
                >
                  <Avatar uri={organizer.profilePicture} name={organizer.fullName} size="md" />
                  <View style={styles.organizerInfo}>
                    <Text style={styles.organizerName}>{organizer.fullName}</Text>
                    {isOwner && (
                      <Text style={styles.youBadge}>Vous</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Action Buttons */}
            {!isOwner && (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleContactOrganizer}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text.inverse} />
                <Text style={styles.contactButtonText}>Contacter l'organisateur</Text>
              </TouchableOpacity>
            )}

            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.size.lg,
    color: theme.colors.text.secondary,
  },
  backButtonLarge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  backButtonText: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.weight.semibold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverContainer: {
    height: 200,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
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
  sportBadgeText: {
    color: '#fff',
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.size.xl,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
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
  distance: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
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
  descriptionText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  organizerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  organizerLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  organizerName: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
  },
  youBadge: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.primary,
    marginTop: 2,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  contactButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
  bottomSpacer: {
    height: theme.spacing.xxl,
  },
});
