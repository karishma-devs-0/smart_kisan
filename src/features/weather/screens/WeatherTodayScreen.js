import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import { fetchCurrentWeather, fetchForecast } from '../slice/weatherSlice';
import ScreenLayout from '../../../components/common/ScreenLayout';
import SpeakButton from '../../../components/common/SpeakButton';
import { readable } from '../../../services/speech';
import { spraySchedule, stressAlerts } from '../../../services/weatherAdvisoryEngine';

const MetricCard = ({ icon, label, value, color }) => (
  <View style={styles.metricCard}>
    <MaterialCommunityIcons name={icon} size={24} color={color} />
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const WeatherTodayScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const weather = useSelector((s) => s.weather);
  const location = useSelector((s) => s.settings.location);
  const crops = useSelector((s) => s.crops?.crops || []);
  // No invented weather. This fell back to 39 degrees at 71% humidity, which
  // every farmer saw as their own conditions whenever the reading had not
  // arrived - including when it had failed.
  const current = weather.current || null;
  const forecast = weather.forecast || [];

  // Worked out here rather than read from the analytics state, so the advice
  // is present whenever the forecast is, without waiting on another screen's
  // fetch to have run first.
  const spray = useMemo(() => spraySchedule(forecast), [forecast]);
  const alerts = useMemo(() => stressAlerts(forecast, crops), [forecast, crops]);

  const VERDICT = {
    good: { colour: COLORS.success, icon: 'spray', label: t('weather.sprayGood', 'Good day to spray') },
    caution: { colour: COLORS.warning, icon: 'alert-outline', label: t('weather.sprayCaution', 'Spray with care') },
    no: { colour: COLORS.danger, icon: 'close-circle-outline', label: t('weather.sprayNo', 'Do not spray') },
  };

  const isDefaultLocation = !location || (location?.lat === 21.1458 && location?.lng === 79.0882);

  useEffect(() => {
    dispatch(fetchCurrentWeather());
    dispatch(fetchForecast());
  }, [dispatch]);

  return (
    <ScreenLayout prefix={t('weather.thePrefix')} title={t('weather.title')} scrollable={true}>
      {isDefaultLocation && (
        <TouchableOpacity
          style={styles.locationBanner}
          onPress={() => navigation.navigate('SettingsTab', { screen: 'SettingsDetail', params: { setting: 'location', title: 'Location' } })}
        >
          <MaterialCommunityIcons name="map-marker-alert-outline" size={20} color={COLORS.warning} />
          <Text style={styles.locationBannerText}>Weather is showing for default location. Tap to set your farm location.</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
      <Text style={styles.locationText}>{location?.name || t('weather.setFarmLocation', 'Set your farm location')}</Text>
      {/* Today's Weather */}
      {current ? (
        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>{t('weather.today')}</Text>
          <View style={styles.todayRow}>
            <View>
              <Text style={styles.tempText}>{current.temp}°C</Text>
              <Text style={styles.conditionText}>{current.condition}</Text>
              {current.feelsLike != null && (
                <Text style={styles.feelsLike}>
                  {t('weather.feelsLike')} {current.feelsLike}°C
                </Text>
              )}
            </View>
            <MaterialCommunityIcons name="weather-sunny" size={80} color="#FF9800" />
          </View>
        </View>
      ) : (
        <View style={styles.todayCard}>
          <Text style={styles.loadingText}>
            {t('weather.loading', 'Getting the weather for your farm…')}
          </Text>
        </View>
      )}

      {/* ── What the forecast means for the week's work ──────────────────
          The screens showed the numbers and left the farmer to decide. These
          are the two decisions those numbers actually drive. */}

      {alerts.length > 0 && (
        <>
          <Text style={styles.adviceHeading}>
            {t('weather.warnings', 'Worth knowing')}
          </Text>
          {alerts.slice(0, 3).map((a, i) => {
            const colour = a.severity === 'severe' ? COLORS.danger : COLORS.warning;
            return (
              <View key={i} style={[styles.alertCard, { borderLeftColor: colour }]}>
                <View style={styles.alertHeader}>
                  <MaterialCommunityIcons
                    name={a.kind === 'frost' || a.kind === 'cold' ? 'snowflake'
                      : a.kind === 'rain' ? 'weather-pouring' : 'thermometer-alert'}
                    size={18}
                    color={colour}
                  />
                  <Text style={[styles.alertTitle, { color: colour }]}>{a.title}</Text>
                  <SpeakButton text={readable(a.title, a.detail)} color={colour} size={18} />
                </View>
                <Text style={styles.alertDetail}>{a.detail}</Text>
                <Text style={styles.alertBasis}>{a.basis}</Text>
              </View>
            );
          })}
        </>
      )}

      {spray.days.length > 0 && (
        <>
          <Text style={styles.adviceHeading}>
            {t('weather.sprayWindow', 'Spraying this week')}
          </Text>
          <View style={styles.sprayCard}>
            {spray.days.slice(0, 5).map((d) => {
              const v = VERDICT[d.verdict];
              return (
                <View key={d.date} style={styles.sprayRow}>
                  <MaterialCommunityIcons name={v.icon} size={18} color={v.colour} />
                  <Text style={styles.sprayDay}>{d.when}</Text>
                  <View style={styles.sprayReasonWrap}>
                    <Text style={[styles.sprayVerdict, { color: v.colour }]}>{v.label}</Text>
                    {d.reasons.length > 0 && (
                      <Text style={styles.sprayReason}>{d.reasons.join('; ')}</Text>
                    )}
                  </View>
                </View>
              );
            })}
            {spray.note && <Text style={styles.sprayNote}>{spray.note}</Text>}
          </View>
        </>
      )}
      {/* Metrics Grid. Only when there is a reading: these read straight off
          `current`, so they threw on null once the invented 39-degree
          fallback was removed. Each cell also copes with a provider that does
          not supply that particular figure. */}
      {current && (
        <View style={styles.metricsGrid}>
          <MetricCard icon="water-percent" label={t('weather.humidity')}
            value={current.humidity != null ? `${current.humidity}%` : '—'} color={COLORS.info} />
          <MetricCard icon="weather-windy" label={t('weather.windSpeed')}
            value={current.windSpeed != null ? `${current.windSpeed} km/h` : '—'} color={COLORS.textSecondary} />
          <MetricCard icon="weather-rainy" label={t('weather.precipitation')}
            value={current.precipitation != null ? `${current.precipitation}mm` : '—'} color={COLORS.info} />
          <MetricCard icon="white-balance-sunny" label={t('weather.uvIndex')}
            value={current.uvIndex != null ? `${current.uvIndex}` : '—'} color={COLORS.warning} />
        </View>
      )}
      {/* Quick Links */}
      <View style={styles.linksRow}>
        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('WeatherForecast')}>
          <MaterialCommunityIcons name="calendar-week" size={20} color={COLORS.primary} />
          <Text style={styles.linkText}>{t('weather.fiveDayForecast')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('HistoricalWeather')}>
          <MaterialCommunityIcons name="chart-line" size={20} color={COLORS.primary} />
          <Text style={styles.linkText}>{t('weather.historicalData')}</Text>
        </TouchableOpacity>
      </View>
      {/* Detail Links */}
      <TouchableOpacity style={styles.detailRow} onPress={() => navigation.navigate('WindDetail')}>
        <MaterialCommunityIcons name="weather-windy" size={22} color={COLORS.textSecondary} />
        <Text style={styles.detailLabel}>{t('weather.windDetails')}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.detailRow} onPress={() => navigation.navigate('HumidityDetail')}>
        <MaterialCommunityIcons name="water-percent" size={22} color={COLORS.info} />
        <Text style={styles.detailLabel}>{t('weather.humidityDetails')}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.detailRow} onPress={() => navigation.navigate('ETCalculator')}>
        <MaterialCommunityIcons name="calculator-variant" size={22} color={COLORS.primary} />
        <Text style={styles.detailLabel}>ET Calculator</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>
      {/* Forecast Preview */}
      {forecast.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('weather.forecast')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastRow}>
            {forecast.slice(0, 5).map((day, i) => (
              <View key={i} style={[styles.forecastCard, i === 0 && styles.forecastCardActive]}>
                <Text style={styles.forecastDay}>{day.day || `Day ${i + 1}`}</Text>
                <MaterialCommunityIcons name={day.icon || 'weather-partly-cloudy'} size={28} color={i === 0 ? COLORS.primary : COLORS.textSecondary} />
                <Text style={styles.forecastTemp}>{day.high || 38}°</Text>
                <Text style={styles.forecastLow}>{day.low || 26}°</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  loadingText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center' },
  adviceHeading: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  alertCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  alertTitle: { flex: 1, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold },
  alertDetail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  alertBasis: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  sprayCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  sprayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  sprayDay: { width: 76, fontSize: FONT_SIZES.sm, color: COLORS.textPrimary },
  sprayReasonWrap: { flex: 1 },
  sprayVerdict: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium },
  sprayReason: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 1 },
  sprayNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 16,
  },
  locationBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: '#FFE082' },
  locationBannerText: { flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.textPrimary },
  locationText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  todayCard: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, marginBottom: SPACING.xl },
  todayLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.md },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tempText: { fontSize: FONT_SIZES.hero, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  conditionText: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary },
  feelsLike: { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, marginTop: 4 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xl },
  metricCard: { width: '47%', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm },
  metricValue: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  metricLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  linksRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  linkButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.primarySurface, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md },
  linkText: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: FONT_WEIGHTS.medium },
  detailRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, gap: SPACING.md },
  detailLabel: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md, marginTop: SPACING.md },
  forecastRow: { marginBottom: SPACING.lg },
  forecastCard: { width: 80, alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginRight: SPACING.md, gap: SPACING.xs },
  forecastCardActive: { backgroundColor: COLORS.primarySurface, borderWidth: 1, borderColor: COLORS.primary },
  forecastDay: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium },
  forecastTemp: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  forecastLow: { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary },
});

export default WeatherTodayScreen;
