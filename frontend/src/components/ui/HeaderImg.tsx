import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

/**
 * Header Image Component for Tabs
 *
 * Smaller header for main app screens
 */
export const HeaderImg: React.FC = () => {
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

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: 'white',
    width: '100%',
  },
  headerImage: {
    width: '100%',
    height: 100,
  },
});
