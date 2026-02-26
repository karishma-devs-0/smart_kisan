import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const SIZES = {
  sm: { trackWidth: 40, trackHeight: 22, thumbSize: 18, thumbMargin: 2 },
  md: { trackWidth: 50, trackHeight: 28, thumbSize: 24, thumbMargin: 2 },
};

const Toggle = ({ value, onValueChange, disabled = false, size = 'md' }) => {
  const dims = SIZES[size] || SIZES.md;
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      dims.thumbMargin,
      dims.trackWidth - dims.thumbSize - dims.thumbMargin,
    ],
  });

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E0E0E0', COLORS.primaryLight],
  });

  const handlePress = () => {
    if (!disabled && onValueChange) {
      onValueChange(!value);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled}
      style={disabled && styles.disabled}
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: dims.trackWidth,
            height: dims.trackHeight,
            borderRadius: dims.trackHeight / 2,
            backgroundColor: trackColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: dims.thumbSize,
              height: dims.thumbSize,
              borderRadius: dims.thumbSize / 2,
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
  },
  thumb: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Toggle;
