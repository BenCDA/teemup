import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ProBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  showText?: boolean;
}

const sizes = {
  sm: { height: 18, fontSize: 10, iconSize: 10, padding: 6 },
  md: { height: 24, fontSize: 12, iconSize: 12, padding: 8 },
  lg: { height: 32, fontSize: 14, iconSize: 16, padding: 12 },
};

export function ProBadge({ size = 'md', style, showText = true }: ProBadgeProps) {
  const config = sizes[size];

  return (
    <LinearGradient
      colors={['#FFD700', '#FFA500']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          height: config.height,
          paddingHorizontal: config.padding,
          borderRadius: config.height / 2,
        },
        style,
      ]}
    >
      <Ionicons name="star" size={config.iconSize} color="#fff" />
      {showText && (
        <Text style={[styles.text, { fontSize: config.fontSize }]}>PRO</Text>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  text: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
