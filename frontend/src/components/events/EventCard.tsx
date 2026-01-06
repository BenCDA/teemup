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

const sportCoverImages: Record<string, string> = {
  running: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=300&fit=crop',
  swimming: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=300&fit=crop',
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=300&fit=crop',
  football: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=300&fit=crop',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=300&fit=crop',
  cycling: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&h=300&fit=crop',
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=300&fit=crop',
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=300&fit=crop',
  boxing: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&h=300&fit=crop',
  hiking: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=300&fit=crop',
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
