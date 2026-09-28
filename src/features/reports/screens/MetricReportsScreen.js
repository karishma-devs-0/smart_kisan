import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReports } from '../slice/reportsSlice';

/**
 * Farm metrics, from recorded pump runs.
 *
 * These four figures were written into the file - 2,450 litres, 156 hours, 8.5
 * hours a day, an 85% mixing ratio - so every farmer saw the same numbers and
 * they did not change when the server began returning real ones. Mixing ratio
 * is gone entirely: nothing in the app measures it.
 */
const buildMetrics = (t, gm, energy) => {
  if (!gm) return [];

  const rows = [
    { key: 'water', label: t('metricReports.waterConsumption'),
      m: gm.waterConsumption, icon: 'water', color: COLORS.info },
    { key: 'hours', label: t('metricReports.totalRunHours'),
      m: gm.totalRunHours, icon: 'clock-outline', color: COLORS.primary },
    { key: 'perDay', label: t('metricReports.pumpRuntime'),
      m: gm.pumpRuntime, icon: 'water-pump', color: COLORS.success },
    { key: 'energy', label: t('metricReports.electricity', 'Electricity Used'),
      m: gm.energyUse, icon: 'flash', color: COLORS.warning },
  ];

  return rows
    .filter((r) => r.m && r.m.value !== null && r.m.value !== undefined)
    .map((r) => ({
      label: r.label,
      value: Number(r.m.value).toLocaleString(),
      unit: r.m.unit,
      // Null when there is no earlier period to compare against - a first
      // month of use should not claim to be up or down on anything.
      change: r.m.change ?? null,
      icon: r.icon,
      color: r.color,
    }));
};

const MetricReportsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const generalMetrics = useSelector((state) => state.reports.generalMetrics);

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  const metrics = buildMetrics(t, generalMetrics);
  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
        <Text style={styles.titlePrefix}>{t('metricReports.titlePrefix')}</Text><Text style={styles.titleText}>{' ' + t('metricReports.title')}</Text>
      </View>
      <Text style={styles.sectionTitle}>{t('metricReports.generalMetrics')}</Text>
      {!metrics.length && (
        <Text style={styles.emptyText}>
          {t('metricReports.noData',
            'No pump runs recorded yet. Once a pump has run, the water, hours '
            + 'and electricity it used appear here.')}
        </Text>
      )}

      <View style={styles.grid}>
        {metrics.map((m, i) => (
          <View key={i} style={styles.metricCard}>
            <MaterialCommunityIcons name={m.icon} size={24} color={m.color} />
            <Text style={styles.metricValue}>{m.value}</Text>
            <Text style={styles.metricUnit}>{m.unit}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
            {m.change !== null && (
              <View style={[styles.changeBadge, { backgroundColor: m.change >= 0 ? COLORS.success + '20' : COLORS.danger + '20' }]}>
                <MaterialCommunityIcons name={m.change >= 0 ? 'arrow-up' : 'arrow-down'} size={12} color={m.change >= 0 ? COLORS.success : COLORS.danger} />
                <Text style={[styles.changeText, { color: m.change >= 0 ? COLORS.success : COLORS.danger }]}>{Math.abs(m.change)}%</Text>
              </View>
            )}
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.exportBtn}>
        <MaterialCommunityIcons name="download" size={20} color={COLORS.white} />
        <Text style={styles.exportText}>{t('metricReports.exportReports')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  emptyText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 19, marginBottom: SPACING.lg },
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxxl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  titlePrefix: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  titleText: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  metricCard: { width: '47%', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'center', gap: SPACING.xs },
  metricValue: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  metricUnit: { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, marginTop: -4 },
  metricLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center' },
  changeBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2, gap: 2 },
  changeText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, marginTop: SPACING.xxl, gap: SPACING.sm },
  exportText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
});

export default MetricReportsScreen;
