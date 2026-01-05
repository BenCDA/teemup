import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/features/shared/styles/theme';

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}

export function Header({
  title,
  showLogo = false,
  showBack = false,
  onBack,
  rightIcon,
  onRightPress,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.left}>
            {showBack && (
              <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                <Ionicons name="chevron-back" size={24} color={theme.colors.text.inverse} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.center}>
            {showLogo ? (
              <Text style={styles.logoText}>
                <Text style={styles.logoTeem}>Teem</Text>
                <Text style={styles.logoUp}>Up</Text>
              </Text>
            ) : (
              <Text style={styles.title}>{title}</Text>
            )}
          </View>

          <View style={styles.right}>
            {rightIcon && (
              <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
                <Ionicons name={rightIcon} size={24} color={theme.colors.text.inverse} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary,
  },
  safeArea: {
    backgroundColor: theme.colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  left: {
    width: 40,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 40,
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: theme.spacing.xs,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  logoTeem: {
    color: theme.colors.text.inverse,
  },
  logoUp: {
    color: theme.colors.gold,
  },
  title: {
    fontSize: theme.typography.size.lg,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
});
