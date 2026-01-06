import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { eventService } from '@/features/events/eventService';
import { SportEvent } from '@/types';
import { EventCard } from '@/components/events/EventCard';
import { DistanceSlider, EmptyState } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';
import { SPORTS, sportMatchesFilter } from '@/constants/sports';
import { useLocation } from '@/hooks/useLocation';

export default function EventsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState(50);
  const [showFilters, setShowFilters] = useState(false);

  const { getCurrentLocation, latitude, longitude, isLoading: isLoadingLocation } = useLocation();

  // Get user location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const {
    data: events,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['nearbyEvents', latitude, longitude, maxDistance],
    queryFn: () => {
      if (latitude && longitude) {
        return eventService.getNearbyEvents({
          latitude,
          longitude,
          maxDistance,
        });
      }
      return eventService.getPublicEvents();
    },
    enabled: true,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getCurrentLocation();
    await refetch();
    setRefreshing(false);
  }, [refetch, getCurrentLocation]);

  const toggleSport = (sport: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleDistanceChange = (value: number) => {
    setMaxDistance(value);
  };

  const handleCreateEvent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/event/create');
  };

  const toggleFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFilters(!showFilters);
  };

  // Filter events by selected sports (client-side)
  let displayedEvents = events;
  if (selectedSports.length > 0 && displayedEvents) {
    displayedEvents = displayedEvents.filter((event) =>
      selectedSports.some((filterKey) => sportMatchesFilter(event.sport, filterKey))
    );
  }

  const renderEvent = ({ item }: { item: SportEvent }) => {
    return <EventCard event={item} showDistance={!!latitude && !!longitude} />;
  };

  const isLocationReady = latitude !== null && longitude !== null;

  return (
    <View style={styles.container}>
      {/* Filters Section */}
      <View style={styles.filtersSection}>
        {/* Filter Toggle & Distance Info */}
        <View style={styles.filterHeader}>
          <TouchableOpacity style={styles.filterToggle} onPress={toggleFilters}>
            <Ionicons
              name={showFilters ? 'options' : 'options-outline'}
              size={20}
              color={showFilters ? theme.colors.primary : theme.colors.text.secondary}
            />
            <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>
              Filtres
            </Text>
            <Ionicons
              name={showFilters ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>

          {isLocationReady && (
            <View style={styles.distanceInfo}>
              <Ionicons name="location" size={14} color={theme.colors.primary} />
              <Text style={styles.distanceInfoText}>{maxDistance} km</Text>
            </View>
          )}
        </View>

        {/* Expandable Filters */}
        {showFilters && (
          <View style={styles.expandedFilters}>
            {/* Distance Slider */}
            {isLocationReady ? (
              <DistanceSlider
                value={maxDistance}
                onChange={handleDistanceChange}
                min={5}
                max={100}
                step={5}
              />
            ) : (
              <View style={styles.locationWarning}>
                <Ionicons name="location-outline" size={20} color={theme.colors.text.tertiary} />
                <Text style={styles.locationWarningText}>
                  {isLoadingLocation
                    ? 'Obtention de votre position...'
                    : 'Activez la localisation pour filtrer par distance'}
                </Text>
              </View>
            )}

            {/* Sport Filters */}
            <Text style={styles.filterTitle}>Filtrer par sport</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScroll}
            >
              <TouchableOpacity
                style={[styles.sportChip, selectedSports.length === 0 && styles.sportChipActive]}
                onPress={() => setSelectedSports([])}
              >
                <Ionicons
                  name="apps"
                  size={18}
                  color={
                    selectedSports.length === 0
                      ? theme.colors.text.inverse
                      : theme.colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.sportChipText,
                    selectedSports.length === 0 && styles.sportChipTextActive,
                  ]}
                >
                  Tous
                </Text>
              </TouchableOpacity>
              {SPORTS.map((sport) => {
                const isSelected = selectedSports.includes(sport.key);
                return (
                  <TouchableOpacity
                    key={sport.key}
                    style={[
                      styles.sportChip,
                      isSelected && { backgroundColor: sport.color, borderColor: sport.color },
                    ]}
                    onPress={() => toggleSport(sport.key)}
                  >
                    <Ionicons
                      name={sport.icon}
                      size={18}
                      color={isSelected ? theme.colors.text.inverse : sport.color}
                    />
                    <Text style={[styles.sportChipText, isSelected && styles.sportChipTextActive]}>
                      {sport.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedSports.length > 0 && (
              <TouchableOpacity style={styles.clearFilters} onPress={() => setSelectedSports([])}>
                <Ionicons name="close-circle" size={16} color={theme.colors.text.tertiary} />
                <Text style={styles.clearFiltersText}>Effacer les filtres</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Events List */}
      {isLoading || isLoadingLocation ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            {isLoadingLocation ? 'Obtention de votre position...' : 'Chargement des evenements...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedEvents}
          renderItem={renderEvent}
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
            displayedEvents?.length === 0 && styles.emptyContainer,
          ]}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={selectedSports.length > 0 ? 'Aucun evenement trouve' : 'Pas d\'evenements'}
              description={
                selectedSports.length > 0
                  ? 'Essayez de modifier vos filtres ou d\'augmenter la distance.'
                  : 'Soyez le premier a creer un evenement sportif dans votre zone !'
              }
            />
          }
        />
      )}

      {/* FAB - Create Event */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateEvent} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color={theme.colors.text.inverse} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filtersSection: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  filterToggleText: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.secondary,
  },
  filterToggleTextActive: {
    color: theme.colors.primary,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
  },
  distanceInfoText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.medium,
  },
  expandedFilters: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  locationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  locationWarningText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
    flex: 1,
  },
  filterTitle: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  filtersScroll: {
    gap: theme.spacing.sm,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  sportChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sportChipText: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.secondary,
  },
  sportChipTextActive: {
    color: theme.colors.text.inverse,
  },
  clearFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  clearFiltersText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
  },
  listContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
});
