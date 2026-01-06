import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '@/features/shared/styles/theme';

interface DistanceSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export function DistanceSlider({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  label = 'Distance maximale',
}: DistanceSliderProps) {
  const [sliderWidth, setSliderWidth] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const lastHapticValue = useRef(value);

  const valueToPosition = useCallback(
    (val: number) => {
      if (sliderWidth === 0) return 0;
      return ((val - min) / (max - min)) * sliderWidth;
    },
    [sliderWidth, min, max]
  );

  const positionToValue = useCallback(
    (pos: number) => {
      if (sliderWidth === 0) return min;
      const ratio = Math.max(0, Math.min(1, pos / sliderWidth));
      const rawValue = min + ratio * (max - min);
      return Math.round(rawValue / step) * step;
    },
    [sliderWidth, min, max, step]
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setSliderWidth(width);
    animatedValue.setValue(valueToPosition(value));
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const touchX = evt.nativeEvent.locationX;
      const newValue = positionToValue(touchX);
      onChange(newValue);
      animatedValue.setValue(touchX);
    },
    onPanResponderMove: (evt, gestureState) => {
      const newPos = Math.max(0, Math.min(sliderWidth, gestureState.moveX - 16));
      const newValue = positionToValue(newPos);

      // Haptic feedback every 10km
      if (Math.abs(newValue - lastHapticValue.current) >= 10) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        lastHapticValue.current = newValue;
      }

      onChange(newValue);
      animatedValue.setValue(newPos);
    },
    onPanResponderRelease: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  });

  const position = valueToPosition(value);
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value} km</Text>
      </View>

      <View
        style={styles.sliderContainer}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        {/* Background track */}
        <View style={styles.track} />

        {/* Filled track */}
        <Animated.View
          style={[
            styles.filledTrack,
            {
              width: `${percentage}%`,
            },
          ]}
        />

        {/* Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              left: position - 14, // Half of thumb width
            },
          ]}
        >
          <View style={styles.thumbInner} />
        </Animated.View>
      </View>

      {/* Labels */}
      <View style={styles.labels}>
        <Text style={styles.minLabel}>{min} km</Text>
        <Text style={styles.maxLabel}>{max} km</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
    color: theme.colors.primary,
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  filledTrack: {
    height: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  thumbInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  minLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
  },
  maxLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
  },
});
