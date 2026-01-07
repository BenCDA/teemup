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
  Animated,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [showFilters, setShowFilters] = useState(true);

  const { getCurrentLocation, latitude, longitude, isLoading: isLoadingLocation } = useLocation();

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedSports([]);
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

  // Filter events by selected sports
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

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.resultsCount}>
        {displayedEvents?.length || 0} événement{(displayedEvents?.length || 0) > 1 ? 's' : ''}
        {isLocationReady ? ` dans un rayon de ${maxDistance} km` : ''}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filters Section */}
      <View style={styles.filtersContainer}>
        {/* Filter Header */}
        <View style={styles.filtersHeader}>
          <TouchableOpacity
            style={styles.filterToggle}
            onPress={toggleFilters}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showFilters ? 'options' : 'options-outline'}
              size={18}
              color={showFilters ? theme.colors.primary : theme.colors.text.secondary}
            />
            <Text style={[styles.filtersTitle, showFilters && styles.filtersTitleActive]}>
              Filtres
            </Text>
            <Ionicons
              name={showFilters ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>

          <View style={styles.headerRight}>
            {isLocationReady && (
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={12} color={theme.colors.success} />
                <Text style={styles.locationBadgeText}>{maxDistance} km</Text>
              </View>
            )}
            {selectedSports.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>Effacer ({selectedSports.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Expandable Filters */}
        {showFilters && (
          <View style={styles.expandedFilters}>
            {/* Distance Slider */}
            {isLocationReady ? (
              <View style={styles.distanceSection}>
                <DistanceSlider
                  value={maxDistance}
                  onChange={handleDistanceChange}
                  min={5}
                  max={100}
                  step={5}
                />
              </View>
            ) : (
              <View style={styles.locationWarning}>
                <View style={styles.locationWarningIcon}>
                  <Ionicons name="location-outline" size={18} color={theme.colors.warning} />
                </View>
                <Text style={styles.locationWarningText}>
                  {isLoadingLocation
                    ? 'Obtention de votre position...'
                    : 'Activez la localisation pour filtrer par distance'}
                </Text>
              </View>
            )}

            {/* Sport Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScroll}
              decelerationRate="fast"
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedSports.length === 0 && styles.filterChipAllActive
                ]}
                onPress={clearFilters}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="globe-outline"
                  size={16}
                  color={selectedSports.length === 0 ? '#fff' : theme.colors.text.secondary}
                />
                <Text style={[
                  styles.filterChipText,
                  selectedSports.length === 0 && styles.filterChipTextActive
                ]}>
                  Tous
                </Text>
              </TouchableOpacity>

              {SPORTS.map((sport) => {
                const isSelected = selectedSports.includes(sport.key);
                return (
                  <TouchableOpacity
                    key={sport.key}
                    style={[
                      styles.filterChip,
                      isSelected && {
                        backgroundColor: sport.color,
                        borderColor: sport.color,
                        shadowColor: sport.color,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      },
                    ]}
                    onPress={() => toggleSport(sport.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={sport.icon}
                      size={16}
                      color={isSelected ? '#fff' : sport.color}
                    />
                    <Text style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive
                    ]}>
                      {sport.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={10} color={sport.color} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Events List */}
      {isLoading || isLoadingLocation ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            {isLoadingLocation ? 'Obtention de votre position...' : 'Chargement des événements...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedEvents}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
              progressBackgroundColor={theme.colors.surface}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            displayedEvents?.length === 0 && styles.emptyContainer,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={selectedSports.length > 0 ? 'Aucun événement trouvé' : 'Pas d\'événements'}
              description={
                selectedSports.length > 0
                  ? 'Aucun événement ne correspond à vos filtres actuels.'
                  : 'Soyez le premier à créer un événement sportif dans votre zone !'
              }
              actionLabel={selectedSports.length > 0 ? 'Effacer les filtres' : 'Créer un événement'}
              onAction={selectedSports.length > 0 ? clearFilters : handleCreateEvent}
            />
          }
        />
      )}

      {/* FAB - Create Event */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateEvent}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[theme.colors.primary, '#1a1a2e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filtersTitleActive: {
    color: theme.colors.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.colors.success}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  locationBadgeText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${theme.colors.primary}12`,
    borderRadius: 16,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  expandedFilters: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  distanceSection: {
    marginBottom: 12,
  },
  locationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${theme.colors.warning}10`,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  locationWarningIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${theme.colors.warning}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationWarningText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  filtersScroll: {
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: 6,
  },
  filterChipAllActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
  },
  listHeader: {
    paddingBottom: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
