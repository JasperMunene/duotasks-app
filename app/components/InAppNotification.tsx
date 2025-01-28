import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotification } from '../context/NotificationContext';
import { Text } from './Text';

export function InAppNotification() {
  const { currentNotification, hideNotification } = useNotification();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    if (currentNotification) {
      // Trigger extended haptic feedback
      const triggerHaptics = async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Add a small delay
        await new Promise(resolve => setTimeout(resolve, 100));
        // Second vibration for extended feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      };
      
      triggerHaptics();
      
      // Slide in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();
    } else {
      // Slide out
      Animated.spring(translateY, {
        toValue: -200,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();
    }
  }, [currentNotification]);

  // Handle press for top notification
  const handlePress = () => {
    hideNotification();
    if (currentNotification?.route) {
      router.push(currentNotification.route as any);
    }
  };

  return (
    <>
      {currentNotification && (
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY }],
              top: insets.top,
              width: width - 32,
            },
          ]}
        >
          <Pressable
            style={styles.content}
            onPress={handlePress}
            android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
          >
            {currentNotification.image && (
              <Image
                source={{ uri: currentNotification.image }}
                style={styles.image}
              />
            )}
            <View style={styles.textContainer}>
              <Text style={styles.title} medium numberOfLines={1}>
                {currentNotification.title}
              </Text>
              <Text style={styles.message} numberOfLines={2}>
                {currentNotification.message}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 2,
    color: '#000',
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
}); 