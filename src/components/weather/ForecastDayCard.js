import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../constants/layout';

const ForecastDayCard = React.memo(({
  day,
  high,
  low,
  icon = 'weather-sunny',
  condition,
  isActive = false,
}) => {
  return (
    <View
      style={[
        styles.container,
        isActive && styles.active,
      ]}
    >
      <Text style={[styles.day, isActive && styles.activeText]}>{day}</Text>
      <MaterialCommunityIcons
        name={icon}
        size={28}
        color={isActive ? COLORS.primary : COLORS.warning}
        style={styles.icon}
      />
      <Text style={[styles.high, isActive && styles.activeText]}>{high}°</Text>
      <Text style={styles.low}>{low}°</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.white,
    minWidth: 70,
    marginRight: SPACING.sm,
    ...SHADOWS.sm,
  },
  active: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  day: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  activeText: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  icon: {
    marginBottom: SPACING.sm,
  },
  high: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  low: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
});

export default ForecastDayCard;
