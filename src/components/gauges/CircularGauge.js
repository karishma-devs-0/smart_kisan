import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const CircularGauge = ({
  value,
  maxValue = 100,
  unit = '%',
  label,
  color = COLORS.primary,
  size = 120,
  strokeWidth = 10,
  backgroundColor = '#E8F5E9',
}) => {
  const fillPercentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <View style={styles.container}>
      <AnimatedCircularProgress
        size={size}
        width={strokeWidth}
        fill={fillPercentage}
        tintColor={color}
        backgroundColor={backgroundColor}
        rotation={0}
        lineCap="round"
        duration={1000}
      >
        {() => (
          <View style={styles.centerContent}>
            <Text style={[styles.value, { fontSize: size * 0.2 }]}>
              {Math.round(value)}
              <Text style={[styles.unit, { fontSize: size * 0.12 }]}>{unit}</Text>
            </Text>
          </View>
        )}
      </AnimatedCircularProgress>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  unit: {
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  label: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
});

export default CircularGauge;
