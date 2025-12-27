import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { friendService } from '@/features/friends/friendService';
import { User } from '@/types';
import { Avatar, Card, SportBadge, EmptyState } from '@/components/ui';
import { theme } from '@/features/shared/styles/theme';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['discoverUsers'],
    queryFn: friendService.getDiscoverUsers,
  });

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['searchUsers', searchQuery],
    queryFn: () => friendService.searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  const sendRequestMutation = useMutation({
    mutationFn: friendService.sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discoverUsers'] });
      Alert.alert('Succès', 'Demande d\'ami envoyée !');
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.response?.data?.message || 'Une erreur est survenue');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const displayedUsers = searchQuery.length >= 2 ? searchResults : users;

  const renderUser = ({ item }: { item: User }) => (
    <Card variant="elevated" style={styles.userCard}>
      <View style={styles.userHeader}>
        <Avatar
          uri={item.profilePicture}
          name={item.fullName}
          size="lg"
          showOnline
          isOnline={item.isOnline}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.fullName}</Text>
          {item.bio && (
            <Text style={styles.userBio} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>

      {item.sports && item.sports.length > 0 && (
        <View style={styles.sportsRow}>
          {item.sports.slice(0, 4).map((sport, index) => (
            <SportBadge key={index} sport={sport} size="sm" />
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => sendRequestMutation.mutate(item.id)}
        disabled={sendRequestMutation.isPending}
      >
        {sendRequestMutation.isPending ? (
          <ActivityIndicator size="small" color={theme.colors.text.inverse} />
        ) : (
          <>
            <Ionicons name="person-add" size={18} color={theme.colors.text.inverse} />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </>
        )}
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher des sportifs..."
          placeholderTextColor={theme.colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading || isSearching ? (
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
              title={searchQuery.length >= 2 ? 'Aucun résultat' : 'Personne à découvrir'}
              description="Revenez plus tard pour découvrir de nouveaux sportifs !"
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.size.lg,
    color: theme.colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
    paddingTop: 0,
    gap: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
  },
  userCard: {
    gap: theme.spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
  },
  userBio: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  sportsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  addButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
});
