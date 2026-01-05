import { useState, useCallback } from 'react';
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
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { friendService } from '@/features/friends/friendService';
import { User } from '@/types';
import { UserCard, EmptyState } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';

const sportConfig: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  running: { icon: 'walk', color: '#FF6B6B', label: 'Course' },
  cycling: { icon: 'bicycle', color: '#4ECDC4', label: 'Velo' },
  swimming: { icon: 'water', color: '#45B7D1', label: 'Natation' },
  tennis: { icon: 'tennisball', color: '#96CEB4', label: 'Tennis' },
  football: { icon: 'football', color: '#DDA0DD', label: 'Football' },
  basketball: { icon: 'basketball', color: '#F7DC6F', label: 'Basketball' },
  gym: { icon: 'barbell', color: '#BB8FCE', label: 'Musculation' },
  yoga: { icon: 'body', color: '#85C1E9', label: 'Yoga' },
};

const sports = Object.keys(sportConfig);

export default function DiscoverScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
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
      Alert.alert('Succes', 'Demande d\'ami envoyee !');
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Une erreur est survenue');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
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

  // Filter users by selected sports
  let displayedUsers = users;
  if (selectedSports.length > 0 && displayedUsers) {
    displayedUsers = displayedUsers.filter(user =>
      user.sports?.some(sport => selectedSports.includes(sport.toLowerCase()))
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

  return (
    <View style={styles.container}>
      {/* Sport Filters */}
      <View style={styles.filtersSection}>
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
              color={selectedSports.length === 0 ? theme.colors.text.inverse : theme.colors.text.secondary}
            />
            <Text style={[styles.sportChipText, selectedSports.length === 0 && styles.sportChipTextActive]}>
              Tous
            </Text>
          </TouchableOpacity>
          {sports.map((sport) => {
            const config = sportConfig[sport];
            const isSelected = selectedSports.includes(sport);
            return (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.sportChip,
                  isSelected && { backgroundColor: config.color, borderColor: config.color },
                ]}
                onPress={() => toggleSport(sport)}
              >
                <Ionicons
                  name={config.icon}
                  size={18}
                  color={isSelected ? theme.colors.text.inverse : config.color}
                />
                <Text style={[styles.sportChipText, isSelected && styles.sportChipTextActive]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {selectedSports.length > 0 && (
          <TouchableOpacity
            style={styles.clearFilters}
            onPress={() => setSelectedSports([])}
          >
            <Ionicons name="close-circle" size={16} color={theme.colors.text.tertiary} />
            <Text style={styles.clearFiltersText}>Effacer les filtres</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Users List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={displayedUsers}
          renderItem={renderUser}
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
            displayedUsers?.length === 0 && styles.emptyContainer,
          ]}
          ListEmptyComponent={
            <EmptyState
              icon="compass-outline"
              title={selectedSports.length > 0 ? 'Aucun sportif trouve' : 'Personne a decouvrir'}
              description={selectedSports.length > 0
                ? 'Essayez de modifier vos filtres pour trouver plus de sportifs.'
                : 'Revenez plus tard pour decouvrir de nouveaux sportifs !'
              }
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
  filtersSection: {
    backgroundColor: theme.colors.surface,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterTitle: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  filtersScroll: {
    paddingHorizontal: theme.spacing.md,
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
  },
  listContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
  },
});
