import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/features/shared/styles/ThemeContext';
import { Theme } from '@/features/shared/styles/theme';

/**
 * Authentication Header Image Component
 *
 * Larger header specifically for Login and Register screens
 */
export const AuthHeader: React.FC = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.headerContainer}>
      <Image
        source={require('../../../assets/images/teemupHeader.png')}
        style={styles.headerImage}
        resizeMode="cover"
      />
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  headerContainer: {
    backgroundColor: theme.colors.surface,
    width: '100%',
  },
  headerImage: {
    width: '100%',
    height: 200,
  },
});
