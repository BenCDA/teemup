import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

interface SportBadgeProps {
  sport: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sportConfig: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  running: { icon: 'walk', color: '#FF6B6B', label: 'Course' },
  cycling: { icon: 'bicycle', color: '#4ECDC4', label: 'Vélo' },
  swimming: { icon: 'water', color: '#45B7D1', label: 'Natation' },
  tennis: { icon: 'tennisball', color: '#96CEB4', label: 'Tennis' },
  football: { icon: 'football', color: '#DDA0DD', label: 'Football' },
  basketball: { icon: 'basketball', color: '#F7DC6F', label: 'Basketball' },
  gym: { icon: 'barbell', color: '#BB8FCE', label: 'Musculation' },
  yoga: { icon: 'body', color: '#85C1E9', label: 'Yoga' },
};

const sizes = {
  sm: { badge: 32, icon: 16, font: FontSize.xs },
  md: { badge: 48, icon: 24, font: FontSize.sm },
  lg: { badge: 64, icon: 32, font: FontSize.md },
};

export function SportBadge({ sport, size = 'md', showLabel = false }: SportBadgeProps) {
  const config = sportConfig[sport.toLowerCase()] || { icon: 'help', color: Colors.textLight, label: sport };
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
        <Ionicons name={config.icon} size={sizeConfig.icon} color={Colors.textOnPrimary} />
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
    gap: Spacing.xs,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
