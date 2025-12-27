import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '@/constants/theme';

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
                <Ionicons name="chevron-back" size={24} color={Colors.textOnPrimary} />
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
                <Ionicons name={rightIcon} size={24} color={Colors.textOnPrimary} />
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
    backgroundColor: Colors.primary,
  },
  safeArea: {
    backgroundColor: Colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
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
    padding: Spacing.xs,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  logoTeem: {
    color: Colors.textOnPrimary,
  },
  logoUp: {
    color: Colors.secondary,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.textOnPrimary,
  },
});
