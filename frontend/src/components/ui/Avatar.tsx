import { View, Image, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '@/constants/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showOnline?: boolean;
  isOnline?: boolean;
}

const sizes = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

export function Avatar({
  uri,
  name = '?',
  size = 'md',
  showOnline = false,
  isOnline = false,
}: AvatarProps) {
  const dimension = sizes[size];
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.container, { width: dimension, height: dimension }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: dimension, height: dimension, borderRadius: dimension / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize: dimension * 0.4 }]}>{initials}</Text>
        </View>
      )}
      {showOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              backgroundColor: isOnline ? Colors.online : Colors.offline,
              width: dimension * 0.3,
              height: dimension * 0.3,
              borderRadius: dimension * 0.15,
              right: 0,
              bottom: 0,
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
    backgroundColor: Colors.background,
  },
  placeholder: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
});
