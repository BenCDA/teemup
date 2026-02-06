import { useState } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/features/shared/styles/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  userId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showOnline?: boolean;
  isOnline?: boolean;
  style?: ViewStyle;
}

const sizes = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

// Palette de gradients professionnels pour les avatars sans photo
const AVATAR_GRADIENTS: [string, string][] = [
  ['#667eea', '#764ba2'], // Violet-Purple
  ['#f093fb', '#f5576c'], // Pink-Red
  ['#4facfe', '#00f2fe'], // Blue-Cyan
  ['#43e97b', '#38f9d7'], // Green-Teal
  ['#fa709a', '#fee140'], // Pink-Yellow
  ['#a8edea', '#fed6e3'], // Mint-Pink
  ['#ff9a9e', '#fecfef'], // Coral-Rose
  ['#ffecd2', '#fcb69f'], // Peach-Orange
  ['#a1c4fd', '#c2e9fb'], // Sky Blue
  ['#d299c2', '#fef9d7'], // Lavender-Cream
  ['#89f7fe', '#66a6ff'], // Aqua-Blue
  ['#cd9cf2', '#f6f3ff'], // Purple-Light
];

/**
 * Génère un index de couleur stable basé sur le nom ou l'ID
 * Le même utilisateur aura toujours la même couleur
 */
function getGradientIndex(identifier: string): number {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % AVATAR_GRADIENTS.length;
}

export function Avatar({
  uri,
  name = '?',
  userId,
  size = 'md',
  showOnline = false,
  isOnline = false,
  style,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const dimension = sizes[size];

  const hasValidImage = !!uri && !imageError;

  // Extraire les initiales (max 2 caractères)
  const initials = name
    .split(' ')
    .filter(n => n.length > 0)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  // Sélectionner le gradient basé sur l'ID utilisateur ou le nom
  const identifier = userId || name || 'default';
  const gradientIndex = getGradientIndex(identifier);
  const gradientColors = AVATAR_GRADIENTS[gradientIndex];

  // Taille de la police adaptative
  const fontSize = dimension * (initials.length === 1 ? 0.45 : 0.38);

  return (
    <View style={[styles.container, { width: dimension, height: dimension }, style]}>
      {hasValidImage ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
          onError={() => setImageError(true)}
        />
      ) : (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.placeholder,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                fontSize,
                textShadowColor: 'rgba(0,0,0,0.1)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              },
            ]}
          >
            {initials}
          </Text>
        </LinearGradient>
      )}

      {showOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              backgroundColor: isOnline ? '#22C55E' : theme.colors.text.tertiary,
              width: Math.max(dimension * 0.28, 10),
              height: Math.max(dimension * 0.28, 10),
              borderRadius: Math.max(dimension * 0.14, 5),
              borderWidth: dimension >= 48 ? 2.5 : 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: theme.colors.background,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderColor: theme.colors.surface,
  },
});
