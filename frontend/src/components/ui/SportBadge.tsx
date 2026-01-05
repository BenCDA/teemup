import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/features/shared/styles/theme';

interface SportBadgeProps {
  sport: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

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

const sizes = {
  sm: { badge: 32, icon: 16, font: theme.typography.size.xs },
  md: { badge: 48, icon: 24, font: theme.typography.size.sm },
  lg: { badge: 64, icon: 32, font: theme.typography.size.md },
};

export function SportBadge({ sport, size = 'md', showLabel = false }: SportBadgeProps) {
  const config = sportConfig[sport.toLowerCase()] || { icon: 'help', color: theme.colors.text.tertiary, label: sport };
  const sizeConfig = sizes[size];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: config.color,
            width: sizeConfig.badge,
            height: sizeConfig.badge,
            borderRadius: sizeConfig.badge / 2,
          },
        ]}
      >
        <Ionicons name={config.icon} size={sizeConfig.icon} color={theme.colors.text.inverse} />
      </View>
      {showLabel && (
        <Text style={[styles.label, { fontSize: sizeConfig.font }]}>{config.label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
});
