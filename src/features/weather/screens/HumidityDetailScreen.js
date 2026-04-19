import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { fetchHumidityHistory } from '../slice/weatherSlice';

const HumidityDetailScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useSelector((s) => s.settings.location);
  const current = useSelector((s) => s.weather.current);
  const humidityHistory = useSelector((s) => s.weather.humidityHistory);

  useEffect(() => {
    dispatch(fetchHumidityHistory());
  }, [dispatch]);

  const humidity = current?.humidity ?? 71;
  const temp = current?.temp ?? current?.temperature ?? 38;
  const windSpeed = current?.wind_speed ?? current?.windSpeed ?? 13;
  const windDir = current?.wind_direction ?? current?.windDir ?? 'E';
  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titlePrefix}>{t('weather.thePrefix')}</Text>
        <Text style={styles.titleText}>{' ' + t('weather.title')}</Text>
      </View>
      <Text style={styles.subtitle}>{t('humidityDetail.humidity')}</Text>
      <Text style={styles.location}>{(location?.name || 'Set your farm location') + ` · ${temp}°C`}</Text>
      <View style={styles.bigValueCard}>
        <MaterialCommunityIcons name="water-percent" size={40} color={COLORS.info} />
        <Text style={styles.bigValue}>{humidity}%</Text>
        <Text style={styles.bigLabel}>{t('humidityDetail.currentHumidity')}</Text>
      </View>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('humidityDetail.humidityOverTime')}</Text>
        <View style={styles.chartArea}>
          {(humidityHistory.length > 0 ? humidityHistory.slice(0, 12).map((h) => h.humidity || h.value || 70) : [65, 68, 70, 72, 71, 73, 70, 68, 65, 67, 71, 69]).map((v, i) => (
            <View key={i} style={[styles.chartBar, { height: `${v}%` }]} />
          ))}
        </View>
      </View>
      <View style={styles.statsGrid}>
        <View style={styles.statRow}><MaterialCommunityIcons name="compass" size={20} color={COLORS.textSecondary} /><Text style={styles.statLabel}>{t('humidityDetail.windDirection')}</Text><Text style={styles.statValue}>{windDir}</Text></View>
        <View style={styles.statRow}><MaterialCommunityIcons name="water-percent" size={20} color={COLORS.info} /><Text style={styles.statLabel}>{t('weather.humidity')}</Text><Text style={styles.statValue}>{humidity}%</Text></View>
        <View style={styles.statRow}><MaterialCommunityIcons name="thermometer" size={20} color={COLORS.warning} /><Text style={styles.statLabel}>{t('home.temperature')}</Text><Text style={styles.statValue}>{temp}°C</Text></View>
        <View style={styles.statRow}><MaterialCommunityIcons name="weather-windy" size={20} color={COLORS.textSecondary} /><Text style={styles.statLabel}>{t('weather.windSpeed')}</Text><Text style={styles.statValue}>{windSpeed}km/h</Text></View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxxl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  titlePrefix: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  titleText: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  location: { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, marginBottom: SPACING.xl },
  bigValueCard: { alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xxxl, marginBottom: SPACING.xl, gap: SPACING.md },
  bigValue: { fontSize: FONT_SIZES.display, fontWeight: FONT_WEIGHTS.bold, color: COLORS.info },
  bigLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  chartCard: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl },
  chartTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  chartArea: { height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  chartBar: { width: 16, borderRadius: 4, backgroundColor: COLORS.info + '50' },
  statsGrid: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  statRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.divider, gap: SPACING.md },
  statLabel: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  statValue: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
});

export default HumidityDetailScreen;
