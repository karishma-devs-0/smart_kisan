import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS, SHADOWS, CARD } from '../../constants/layout';

const WeatherCard = ({
  temperature,
  condition,
  icon = 'weather-sunny',
  humidity,
  windSpeed,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.mainRow}>
        <MaterialCommunityIcons
          name={icon}
          size={48}
          color={COLORS.warning}
          style={styles.weatherIcon}
        />
        <View style={styles.tempContainer}>
          <Text style={styles.temperature}>{temperature}°</Text>
          <Text style={styles.condition}>{condition}</Text>
        </View>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <MaterialCommunityIcons
            name="water-percent"
            size={16}
            color={COLORS.info}
          />
          <Text style={styles.metricText}>{humidity}%</Text>
        </View>
        <View style={styles.metric}>
          <MaterialCommunityIcons
            name="weather-windy"
            size={16}
            color={COLORS.textSecondary}
          />
          <Text style={styles.metricText}>{windSpeed} km/h</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: CARD.padding,
    ...SHADOWS.md,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  weatherIcon: {
    marginRight: SPACING.lg,
  },
  tempContainer: {
    flex: 1,
  },
  temperature: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  condition: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.md,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.xl,
  },
  metricText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
});

export default WeatherCard;
