import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/features/shared/styles/ThemeContext';
import { Theme } from '@/features/shared/styles/theme';

/**
 * Header Image Component for Tabs
 *
 * Smaller header for main app screens
 */
export const HeaderImg: React.FC = () => {
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
    height: 100,
  },
});
