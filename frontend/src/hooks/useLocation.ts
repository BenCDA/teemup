import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    address: null,
    isLoading: false,
    error: null,
    permissionStatus: null,
  });

  const checkPermission = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocation(prev => ({ ...prev, permissionStatus: status }));
      return status;
    } catch (error) {
      return null;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocation(prev => ({ ...prev, permissionStatus: status }));

      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'acces a la localisation est necessaire pour cette fonctionnalite. Veuillez l\'activer dans les parametres.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Parametres', onPress: () => Linking.openSettings() },
          ]
        );
      }

      return status === 'granted';
    } catch (error) {
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setLocation(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check permission first
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
      }

      if (status !== 'granted') {
        setLocation(prev => ({
          ...prev,
          isLoading: false,
          error: 'Permission de localisation refusee',
        }));
        return null;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Get address from coordinates
      let address: string | null = null;
      try {
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        if (geocode) {
          const parts = [
            geocode.street,
            geocode.city,
            geocode.region,
            geocode.country,
          ].filter(Boolean);
          address = parts.join(', ');
        }
      } catch (e) {
        // Geocoding failed, continue without address
      }

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address,
        isLoading: false,
        error: null,
        permissionStatus: Location.PermissionStatus.GRANTED,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address,
      };
    } catch (error: any) {
      setLocation(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erreur lors de la recuperation de la position',
      }));
      return null;
    }
  }, []);

  const getAddressFromCoords = useCallback(async (lat: number, lng: number) => {
    try {
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (geocode) {
        const parts = [
          geocode.street,
          geocode.city,
          geocode.region,
          geocode.country,
        ].filter(Boolean);
        return parts.join(', ');
      }
      return null;
    } catch (error) {
      return null;
    }
  }, []);

  const getCoordsFromAddress = useCallback(async (address: string) => {
    try {
      const results = await Location.geocodeAsync(address);
      if (results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }, []);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    ...location,
    getCurrentLocation,
    requestPermission,
    checkPermission,
    getAddressFromCoords,
    getCoordsFromAddress,
  };
}

// Utility function to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
