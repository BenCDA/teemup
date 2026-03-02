import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/features/shared/styles/ThemeContext';
import { Theme } from '@/features/shared/styles/theme';
import { getSportConfig } from '@/constants/sports';

interface SportBadgeProps {
  sport: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const getSizes = (theme: Theme) => ({
  sm: { badge: 32, icon: 16, font: theme.typography.size.xs },
  md: { badge: 48, icon: 24, font: theme.typography.size.sm },
  lg: { badge: 64, icon: 32, font: theme.typography.size.md },
});

export function SportBadge({ sport, size = 'md', showLabel = false }: SportBadgeProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const sizes = useMemo(() => getSizes(theme), [theme]);

  const sportConfig = getSportConfig(sport);
  const config = sportConfig
    ? { icon: sportConfig.icon, color: sportConfig.color, label: sportConfig.label }
    : { icon: 'help' as keyof typeof Ionicons.glyphMap, color: theme.colors.text.tertiary, label: sport };
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

const createStyles = (theme: Theme) => StyleSheet.create({
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
