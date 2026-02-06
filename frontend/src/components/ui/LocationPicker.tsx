import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@/features/shared/styles/theme';
import { useLocation } from '@/hooks/useLocation';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

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
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const {
    getCurrentLocation,
    getCoordsFromAddress,
    isLoading: isGettingLocation,
  } = useLocation();

  // Debounced autocomplete search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't search if text is too short or location already confirmed
    if (searchText.length < 3 || (value?.latitude && value?.longitude)) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=5&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'TeemUp-App',
            },
          }
        );
        const data: NominatimResult[] = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchText, value?.latitude, value?.longitude]);

  const handleSelectSuggestion = (suggestion: NominatimResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const displayName = suggestion.display_name.split(',').slice(0, 3).join(',');
    setSearchText(displayName);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange({
      address: displayName,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    });
  };

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
    setSuggestions([]);
    setShowSuggestions(false);
    onChange(null);
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    // Reset location when user modifies text
    if (value?.latitude && value?.longitude) {
      onChange(null);
    }
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
          onChangeText={handleTextChange}
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

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView style={styles.suggestionsList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.place_id}
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(suggestion)}
              >
                <Ionicons name="location-outline" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {suggestion.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
  suggestionsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionText: {
    flex: 1,
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.primary,
  },
});
