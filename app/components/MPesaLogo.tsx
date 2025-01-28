import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface MPesaLogoProps {
  size?: 'small' | 'medium' | 'large';
}

export default function MPesaLogo({ size = 'medium' }: MPesaLogoProps) {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 48;
      default:
        return 32;
    }
  };

  return (
    <View style={[styles.container, { width: getSize(), height: getSize() }]}>
      <Image
        source={require('../../assets/images/mpesa-logo.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
}); 