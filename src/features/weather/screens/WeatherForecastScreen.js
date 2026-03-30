import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import { useTranslation } from 'react-i18next';
import { fetchForecast } from '../slice/weatherSlice';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getDayName = (item) => {
  if (item.day) return item.day;
  if (item.date) {
    const d = new Date(item.date + 'T00:00:00');
    return DAY_NAMES[d.getDay()];
  }
  return '—';
};

const FALLBACK_FORECAST = [
  { day: 'Mon', high: 39, low: 27, condition: 'Sunny', icon: 'weather-sunny', humidity: 65, windSpeed: 12 },
  { day: 'Tue', high: 37, low: 26, condition: 'Partly Cloudy', icon: 'weather-partly-cloudy', humidity: 70, windSpeed: 10 },
  { day: 'Wed', high: 35, low: 25, condition: 'Cloudy', icon: 'weather-cloudy', humidity: 75, windSpeed: 14 },
  { day: 'Thu', high: 33, low: 24, condition: 'Light Rain', icon: 'weather-rainy', humidity: 82, windSpeed: 16 },
  { day: 'Fri', high: 36, low: 26, condition: 'Sunny', icon: 'weather-sunny', humidity: 68, windSpeed: 11 },
  { day: 'Sat', high: 37, low: 25, condition: 'Partly Cloudy', icon: 'weather-partly-cloudy', humidity: 71, windSpeed: 12, estimated: true },
  { day: 'Sun', high: 34, low: 23, condition: 'Cloudy', icon: 'weather-cloudy', humidity: 76, windSpeed: 15, estimated: true },
  { day: 'Mon', high: 32, low: 22, condition: 'Rain', icon: 'weather-rainy', humidity: 83, windSpeed: 17, estimated: true },
  { day: 'Tue', high: 35, low: 24, condition: 'Partly Cloudy', icon: 'weather-partly-cloudy', humidity: 72, windSpeed: 13, estimated: true },
  { day: 'Wed', high: 38, low: 26, condition: 'Sunny', icon: 'weather-sunny', humidity: 66, windSpeed: 10, estimated: true },
  { day: 'Thu', high: 39, low: 27, condition: 'Sunny', icon: 'weather-sunny', humidity: 64, windSpeed: 9, estimated: true },
  { day: 'Fri', high: 36, low: 25, condition: 'Partly Cloudy', icon: 'weather-partly-cloudy', humidity: 70, windSpeed: 11, estimated: true },
  { day: 'Sat', high: 33, low: 23, condition: 'Cloudy', icon: 'weather-cloudy', humidity: 77, windSpeed: 14, estimated: true },
  { day: 'Sun', high: 34, low: 24, condition: 'Light Rain', icon: 'weather-rainy', humidity: 80, windSpeed: 16, estimated: true },
];

const WeatherForecastScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const forecast = useSelector((s) => s.weather.forecast);
  const data = forecast.length > 0 ? forecast : FALLBACK_FORECAST;
  const [selectedRange, setSelectedRange] = useState(5);

  const displayData = data.slice(0, selectedRange);
  const hasEstimated = displayData.some((d) => d.estimated);

  useEffect(() => { dispatch(fetchForecast()); }, [dispatch]);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titlePrefix}>{t('weather.thePrefix')}</Text>
        <Text style={styles.titleText}>{' ' + t('weather.title')}</Text>
      </View>

      {/* Segment Control */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, selectedRange === 5 && styles.segmentButtonActive]}
          onPress={() => setSelectedRange(5)}
        >
          <Text style={[styles.segmentText, selectedRange === 5 && styles.segmentTextActive]}>5 Day</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, selectedRange === 14 && styles.segmentButtonActive]}
          onPress={() => setSelectedRange(14)}
        >
          <Text style={[styles.segmentText, selectedRange === 14 && styles.segmentTextActive]}>14 Day</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        {selectedRange === 5 ? t('weatherForecast.fiveDayForecast') : '14-Day Forecast'}
      </Text>

      {hasEstimated && (
        <View style={styles.estimatedBanner}>
          <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.info} />
          <Text style={styles.estimatedText}>Days 6-14 are estimated from weather trends</Text>
        </View>
      )}

      {displayData.map((day, i) => (
        <View key={i} style={[styles.forecastCard, day.estimated && styles.forecastCardEstimated]}>
          <View style={styles.dayColumn}>
            <Text style={styles.dayName}>{getDayName(day)}</Text>
            {day.estimated && (
              <Text style={styles.estLabel}>est.</Text>
            )}
          </View>
          <MaterialCommunityIcons name={day.icon} size={32} color={COLORS.warning} />
          <View style={styles.tempColumn}>
            <Text style={styles.highTemp}>{day.high}°</Text>
            <Text style={styles.lowTemp}>{day.low}°</Text>
          </View>
          <View style={styles.detailColumn}>
            <Text style={styles.condText}>{day.condition}</Text>
            <View style={styles.miniMetrics}>
              <MaterialCommunityIcons name="water-percent" size={12} color={COLORS.info} />
              <Text style={styles.miniText}>{day.humidity}%</Text>
              <MaterialCommunityIcons name="weather-windy" size={12} color={COLORS.textTertiary} />
              <Text style={styles.miniText}>{day.windSpeed}km/h</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxxl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  titlePrefix: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  titleText: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.primary,
  },
  segmentText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.white,
  },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  estimatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#E3F2FD',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  estimatedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.info,
    flex: 1,
  },
  forecastCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, gap: SPACING.md },
  forecastCardEstimated: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  dayColumn: { width: 40 },
  dayName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  estLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, fontStyle: 'italic' },
  tempColumn: { alignItems: 'center', width: 50 },
  highTemp: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  lowTemp: { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary },
  detailColumn: { flex: 1 },
  condText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  miniMetrics: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  miniText: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
});

export default WeatherForecastScreen;
