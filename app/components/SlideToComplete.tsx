import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, I18nManager, PanResponder, StyleSheet, View } from 'react-native';

interface SlideToCompleteProps {
  label: string;
  onSlideComplete: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const SLIDER_WIDTH = 320;
const SLIDER_HEIGHT = 56;
const THUMB_SIZE = 48;
const SLIDE_THRESHOLD = SLIDER_WIDTH - THUMB_SIZE - 8;

export const SlideToComplete: React.FC<SlideToCompleteProps> = ({
  label,
  onSlideComplete,
  loading = false,
  disabled = false,
}) => {
  const [completed, setCompleted] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !loading && !disabled && !completed,
      onMoveShouldSetPanResponder: () => !loading && !disabled && !completed,
      onPanResponderMove: (_, gestureState) => {
        if (loading || disabled || completed) return;
        let newX = gestureState.dx;
        if (I18nManager.isRTL) newX = -newX;
        if (newX < 0) newX = 0;
        if (newX > SLIDE_THRESHOLD) newX = SLIDE_THRESHOLD;
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        let newX = gestureState.dx;
        if (I18nManager.isRTL) newX = -newX;
        if (newX > SLIDE_THRESHOLD * 0.95) {
          Animated.timing(translateX, {
            toValue: SLIDE_THRESHOLD,
            duration: 120,
            useNativeDriver: true,
          }).start(() => {
            setCompleted(true);
            onSlideComplete();
            setTimeout(() => {
              translateX.setValue(0);
              setCompleted(false);
            }, 1000);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Text fade/gradient effect
  const textFade = translateX.interpolate({
    inputRange: [0, SLIDE_THRESHOLD * 0.7, SLIDE_THRESHOLD],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { opacity: disabled ? 0.5 : 1 }]}> 
      <View style={styles.track}>
        <Animated.Text
          style={[
            styles.label,
            { opacity: textFade },
          ]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX }] },
          ]}
          {...panResponder.panHandlers}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="chevron-forward" size={32} color="#fff" />
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SLIDER_WIDTH,
    height: SLIDER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 16,
  },
  track: {
    width: '100%',
    height: SLIDER_HEIGHT,
    backgroundColor: '#f3f4f6',
    borderRadius: SLIDER_HEIGHT / 2,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2eac5f',
    overflow: 'hidden',
  },
  label: {
    position: 'absolute',
    left: THUMB_SIZE + 12,
    right: 0,
    color: '#2eac5f',
    fontSize: 22,
    fontWeight: '600',
    alignSelf: 'center',
    textAlign: 'left',
    letterSpacing: 0.5,
  },
  thumb: {
    position: 'absolute',
    left: 4,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#2eac5f',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
});

export default SlideToComplete; 