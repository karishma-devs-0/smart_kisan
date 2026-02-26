import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import { fetchForecast } from '../slice/weatherSlice';

const FALLBACK_FORECAST = [
  { day: 'Mon', high: 39, low: 27, condition: 'Sunny', icon: 'weather-sunny', humidity: 65, windSpeed: 12 },
  { day: 'Tue', high: 37, low: 26, condition: 'Partly Cloudy', icon: 'weather-partly-cloudy', humidity: 70, windSpeed: 10 },
  { day: 'Wed', high: 35, low: 25, condition: 'Cloudy', icon: 'weather-cloudy', humidity: 75, windSpeed: 14 },
  { day: 'Thu', high: 33, low: 24, condition: 'Light Rain', icon: 'weather-rainy', humidity: 82, windSpeed: 16 },
  { day: 'Fri', high: 36, low: 26, condition: 'Sunny', icon: 'weather-sunny', humidity: 68, windSpeed: 11 },
];

const WeatherForecastScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const forecast = useSelector((s) => s.weather.forecast);
  const data = forecast.length > 0 ? forecast : FALLBACK_FORECAST;

  useEffect(() => { dispatch(fetchForecast()); }, [dispatch]);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titlePrefix}>The</Text>
        <Text style={styles.titleText}> Weather</Text>
      </View>
      <Text style={styles.sectionTitle}>5-Day Forecast</Text>
      {data.map((day, i) => (
        <View key={i} style={styles.forecastCard}>
          <View style={styles.dayColumn}>
            <Text style={styles.dayName}>{day.day}</Text>
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
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  forecastCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, gap: SPACING.md },
  dayColumn: { width: 40 },
  dayName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  tempColumn: { alignItems: 'center', width: 50 },
  highTemp: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  lowTemp: { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary },
  detailColumn: { flex: 1 },
  condText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  miniMetrics: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  miniText: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
});

export default WeatherForecastScreen;
