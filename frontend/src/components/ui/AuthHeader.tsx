import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

/**
 * Authentication Header Image Component
 *
 * Larger header specifically for Login and Register screens
 */
export const AuthHeader: React.FC = () => {
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
    height: 200,
  },
});
