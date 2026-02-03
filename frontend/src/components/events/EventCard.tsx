import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SportEvent } from '@/types';
import { theme } from '@/features/shared/styles/theme';
import * as Haptics from 'expo-haptics';
import { getSportConfig, getSportLabel, getSportKey } from '@/constants/sports';

interface EventCardProps {
  event: SportEvent;
  showDistance?: boolean;
}

// Cover images par sport (HTTPS uniquement pour iOS)
const sportCoverImages: Record<string, string> = {
  // Sports collectifs
  football: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=300&fit=crop',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=300&fit=crop',
  volleyball: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=300&fit=crop',
  handball: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=300&fit=crop',
  rugby: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&h=300&fit=crop',
  // Sports de raquette
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=300&fit=crop',
  padel: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=300&fit=crop',
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=300&fit=crop',
  squash: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=300&fit=crop',
  pingpong: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=800&h=300&fit=crop',
  // Sports individuels / Fitness
  running: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=300&fit=crop',
  cycling: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&h=300&fit=crop',
  swimming: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=300&fit=crop',
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=300&fit=crop',
  crossfit: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&h=300&fit=crop',
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=300&fit=crop',
  boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&h=300&fit=crop',
  martial_arts: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=300&fit=crop',
  // Sports outdoor / Aventure
  hiking: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=300&fit=crop',
  climbing: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&h=300&fit=crop',
  skiing: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&h=300&fit=crop',
  surf: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&h=300&fit=crop',
  // Sports de précision
  golf: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=300&fit=crop',
  petanque: 'https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?w=800&h=300&fit=crop',
  // Sports aquatiques
  rowing: 'https://images.unsplash.com/photo-1541534401786-2077eed87a74?w=800&h=300&fit=crop',
  // Danse / Fitness fun
  dance: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&h=300&fit=crop',
  // Autres
  skateboard: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=800&h=300&fit=crop',
  equitation: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800&h=300&fit=crop',
  other: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=300&fit=crop',
};

const defaultCover = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=300&fit=crop';

function getCoverImage(sport: string): string {
  const sportKey = getSportKey(sport);
  return sportCoverImages[sportKey] || defaultCover;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  };
  return date.toLocaleDateString('fr-FR', options);
}

function formatTime(timeStr: string): string {
  // Handle both "HH:mm:ss" and "HH:mm" formats
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

export function EventCard({ event, showDistance = true }: EventCardProps) {
  const sportConfig = getSportConfig(event.sport);
  const sportColor = sportConfig?.color || theme.colors.primary;
  const recurrenceLabel = getRecurrenceLabel(event.recurrence);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/event/${event.id}`);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.9}>
      {/* Cover Image */}
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: getCoverImage(event.sport) }}
          style={styles.coverImage}
          resizeMode="cover"
        />
        {/* Sport Badge Overlay */}
        <View style={[styles.sportBadge, { backgroundColor: sportColor }]}>
          {sportConfig && (
            <Ionicons name={sportConfig.icon} size={14} color="#fff" style={{ marginRight: 4 }} />
          )}
          <Text style={styles.sportBadgeText}>{getSportLabel(event.sport)}</Text>
        </View>

        {/* Distance Badge */}
        {showDistance && event.distanceKm !== undefined && (
          <View style={styles.distanceBadge}>
            <Ionicons name="location" size={12} color={theme.colors.text.inverse} />
            <Text style={styles.distanceText}>{event.distanceKm.toFixed(1)} km</Text>
          </View>
        )}

        {/* Paid Badge */}
        {event.isPaid && (
          <View style={styles.paidBadge}>
            <Ionicons name="cash" size={12} color="#fff" />
            <Text style={styles.paidText}>{event.price?.toFixed(0)} €</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {event.title || getSportLabel(event.sport)}
        </Text>

        {/* Date & Time Row */}
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.infoText}>{formatDate(event.date)}</Text>
          <View style={styles.dot} />
          <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.infoText}>
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </Text>
        </View>

        {/* Location Row */}
        {event.location && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.infoText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}

        {/* Recurrence Badge */}
        {recurrenceLabel && (
          <View style={styles.recurrenceBadge}>
            <Ionicons name="repeat" size={12} color={theme.colors.primary} />
            <Text style={styles.recurrenceText}>{recurrenceLabel}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  coverContainer: {
    height: 120,
    backgroundColor: theme.colors.background,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  sportBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
  },
  sportBadgeText: {
    color: '#fff',
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
  },
  distanceBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    gap: 4,
  },
  distanceText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
  },
  paidBadge: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    gap: 4,
  },
  paidText: {
    color: '#fff',
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.text.tertiary,
    marginHorizontal: theme.spacing.xs,
  },
  recurrenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    marginTop: theme.spacing.xs,
    gap: 4,
  },
  recurrenceText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.medium,
  },
});
