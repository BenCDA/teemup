import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { friendService } from '@/features/friends/friendService';
import { User } from '@/types';
import { UserCard, EmptyState } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';
import { SPORTS, sportMatchesFilter } from '@/constants/sports';

export default function DiscoverScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const queryClient = useQueryClient();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['discoverUsers'],
    queryFn: friendService.getDiscoverUsers,
  });

  const sendRequestMutation = useMutation({
    mutationFn: friendService.sendFriendRequest,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['discoverUsers'] });
      Alert.alert('Succès', 'Demande d\'ami envoyée !');
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Une erreur est survenue');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const toggleSport = (sport: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSports(prev =>
      prev.includes(sport)
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    );
  };

  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedSports([]);
  };

  // Filter users by selected sports
  let displayedUsers = users;
  if (selectedSports.length > 0 && displayedUsers) {
    displayedUsers = displayedUsers.filter(user =>
      user.sports?.some(userSport =>
        selectedSports.some(filterKey => sportMatchesFilter(userSport, filterKey))
      )
    );
  }

  const renderUser = ({ item }: { item: User }) => {
    return (
      <UserCard
        user={item}
        onAddFriend={() => sendRequestMutation.mutate(item.id)}
        isAddingFriend={sendRequestMutation.isPending && sendRequestMutation.variables === item.id}
      />
    );
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.resultsCount}>
        {displayedUsers?.length || 0} sportif{(displayedUsers?.length || 0) > 1 ? 's' : ''}
        {selectedSports.length > 0 ? ' trouvé' + ((displayedUsers?.length || 0) > 1 ? 's' : '') : ''}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filters Section */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersHeader}>
          <View style={styles.filtersTitleRow}>
            <Ionicons name="options-outline" size={18} color={theme.colors.text.secondary} />
            <Text style={styles.filtersTitle}>Filtres</Text>
          </View>
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
          decelerationRate="fast"
        >
          {/* All button */}
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

      {/* Users List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Recherche des sportifs...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={displayedUsers}
          renderItem={renderUser}
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
            displayedUsers?.length === 0 && styles.emptyContainer,
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title={selectedSports.length > 0 ? 'Aucun sportif trouvé' : 'Personne à découvrir'}
              description={selectedSports.length > 0
                ? 'Aucun sportif ne correspond à vos filtres actuels.'
                : 'Revenez plus tard pour découvrir de nouveaux partenaires sportifs !'
              }
              actionLabel={selectedSports.length > 0 ? 'Effacer les filtres' : undefined}
              onAction={selectedSports.length > 0 ? clearFilters : undefined}
            />
          }
        />
      )}
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
    paddingTop: 12,
    paddingBottom: 14,
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
    marginBottom: 12,
  },
  filtersTitleRow: {
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
  filtersScroll: {
    paddingHorizontal: 16,
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
  },
  emptyContainer: {
    flex: 1,
  },
});
