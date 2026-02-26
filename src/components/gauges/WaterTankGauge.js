import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS } from '../../constants/layout';

const WaterTankGauge = ({
  currentLiters,
  maxLiters = 1000,
  height = 150,
}) => {
  const percentage = maxLiters > 0 ? Math.min((currentLiters / maxLiters) * 100, 100) : 0;
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage, fillAnim]);

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, height - 8],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
      <View style={[styles.tank, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              height: fillHeight,
            },
          ]}
        />
        <View style={styles.centerTextContainer}>
          <Text style={styles.litersText}>{currentLiters} Liters</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  percentage: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  tank: {
    width: 80,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: '#90CAF9',
    backgroundColor: '#E3F2FD',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
    backgroundColor: '#2196F3',
    borderBottomLeftRadius: BORDER_RADIUS.md - 2,
    borderBottomRightRadius: BORDER_RADIUS.md - 2,
    opacity: 0.7,
  },
  centerTextContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  litersText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#0D47A1',
  },
});

export default WaterTankGauge;
