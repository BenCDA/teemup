import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@/features/shared/styles/theme';
import { useLocation } from '@/hooks/useLocation';

interface LocationPickerProps {
  value?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  onChange: (location: {
    address: string;
    latitude: number;
    longitude: number;
  } | null) => void;
  placeholder?: string;
}

export function LocationPicker({
  value,
  onChange,
  placeholder = 'Ajouter une localisation',
}: LocationPickerProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState(value?.address || '');
  const {
    getCurrentLocation,
    getCoordsFromAddress,
    isLoading: isGettingLocation,
  } = useLocation();

  const handleGetCurrentLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await getCurrentLocation();
    if (result) {
      setSearchText(result.address || '');
      onChange({
        address: result.address || 'Ma position',
        latitude: result.latitude,
        longitude: result.longitude,
      });
    }
  };

  const handleSearchAddress = async () => {
    if (!searchText.trim()) return;

    setIsSearching(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const coords = await getCoordsFromAddress(searchText);
      if (coords) {
        onChange({
          address: searchText,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchText('');
    onChange(null);
  };

  const hasLocation = value?.latitude && value?.longitude;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons
          name="location-outline"
          size={20}
          color={hasLocation ? theme.colors.primary : theme.colors.text.tertiary}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          value={searchText}
          onChangeText={setSearchText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          returnKeyType="search"
          onSubmitEditing={handleSearchAddress}
        />
        {isSearching ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : searchText ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleGetCurrentLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <>
              <Ionicons name="navigate" size={18} color={theme.colors.primary} />
              <Text style={styles.actionText}>Ma position</Text>
            </>
          )}
        </TouchableOpacity>

        {searchText && !hasLocation && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSearchAddress}
            disabled={isSearching}
          >
            <Ionicons name="search" size={18} color={theme.colors.primary} />
            <Text style={styles.actionText}>Rechercher</Text>
          </TouchableOpacity>
        )}
      </View>

      {hasLocation && (
        <View style={styles.confirmedLocation}>
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
          <Text style={styles.confirmedText}>Localisation confirmee</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  actionText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weight.medium,
  },
  confirmedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  confirmedText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.success,
  },
});
