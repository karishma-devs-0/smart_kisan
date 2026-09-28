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

// Soil Health Card wording, coloured the same way across the app.
const RATING_COLOURS = {
  Good: COLORS.success,
  Optimal: COLORS.success,
  Adequate: COLORS.info,
  Medium: COLORS.warning,
  Fair: COLORS.warning,
  High: COLORS.warning,
  Low: COLORS.danger,
  Acidic: COLORS.danger,
  Alkaline: COLORS.danger,
  'Needs attention': COLORS.danger,
};

/**
 * Soil and harvest, from the farm's own records.
 *
 * Every figure on this screen was hardcoded into the markup - soil rated Good,
 * an estimated 2,400 kg against an actual 2,200 at 91.7% efficiency - so it
 * read the same for every farmer and did not change when the server started
 * returning real ones. It never touched the store at all.
 */
const SoilHarvestReportScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const soil = useSelector((state) => state.reports.soilCondition);
  const harvest = useSelector((state) => state.reports.harvestPerformance);

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  const soilRows = soil
    ? [
        { label: t('soilHarvestReport.overall'), value: soil.overall },
        { label: t('soilHarvestReport.moisture'), value: soil.moisture },
        { label: t('soilHarvestReport.phLevel'), value: soil.pH },
        { label: t('soilHarvestReport.nutrients'), value: soil.nutrients },
      ].filter((r) => r.value)
    : [];

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
        <Text style={styles.titlePrefix}>{t('reports.thePrefix')}</Text><Text style={styles.titleText}>{' ' + t('reports.title')}</Text>
      </View>
      <Text style={styles.sectionTitle}>{t('soilHarvestReport.soilConditionAnalysis')}</Text>
      <View style={styles.card}>
        {soilRows.length ? (
          soilRows.map((item, i) => {
            const colour = RATING_COLOURS[item.value] || COLORS.textSecondary;
            return (
              <View key={i} style={styles.condRow}>
                <Text style={styles.condLabel}>{item.label}</Text>
                <View style={[styles.condBadge, { backgroundColor: colour + '20' }]}>
                  <Text style={[styles.condValue, { color: colour }]}>{item.value}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>
            {t('soilHarvestReport.noSoil',
              'No soil reading yet. Add one from the Soil screen and it will be '
              + 'rated here against Soil Health Card bands.')}
          </Text>
        )}
      </View>
      <Text style={styles.sectionTitle}>{t('soilHarvestReport.harvestPerformance')}</Text>
      <View style={styles.card}>
        {harvest ? (
          <>
            <View style={styles.harvestRow}>
              <Text style={styles.harvestLabel}>{t('soilHarvestReport.actualYield')}</Text>
              <Text style={styles.harvestValue}>{harvest.actualYield} qtl</Text>
            </View>

            {/* Only records carrying an expectation can be compared against
                one. Saying how many is more honest than treating a missing
                expectation as a met one. */}
            {harvest.estimatedYield != null ? (
              <>
                <View style={styles.harvestRow}>
                  <Text style={styles.harvestLabel}>
                    {t('soilHarvestReport.estimatedYield')}
                  </Text>
                  <Text style={styles.harvestValue}>{harvest.estimatedYield} qtl</Text>
                </View>
                <View style={styles.harvestRow}>
                  <Text style={styles.harvestLabel}>
                    {t('soilHarvestReport.efficiency')}
                  </Text>
                  <Text style={[styles.harvestValue, {
                    color: harvest.efficiency >= 90 ? COLORS.success
                      : harvest.efficiency >= 70 ? COLORS.warning : COLORS.danger,
                  }]}>
                    {harvest.efficiency}%
                  </Text>
                </View>
                {harvest.comparable < harvest.harvests && (
                  <Text style={styles.footnote}>
                    {t('soilHarvestReport.comparableNote',
                      'Compared across {{n}} of {{total}} harvests - the rest were '
                      + 'recorded without an expected yield.',
                      { n: harvest.comparable, total: harvest.harvests })}
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.footnote}>
                {t('soilHarvestReport.noExpectation',
                  'None of your harvests recorded an expected yield, so there is '
                  + 'nothing to compare against. Add one when recording a harvest.')}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.emptyText}>
            {t('soilHarvestReport.noHarvest',
              'No harvests recorded yet. Record one and this shows what came off '
              + 'the field against what you expected.')}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  emptyText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 19 },
  footnote: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: SPACING.md, lineHeight: 16 },
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxxl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  titlePrefix: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  titleText: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  card: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl },
  condRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  condLabel: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  condBadge: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  condValue: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold },
  harvestRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  harvestLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  harvestValue: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
});

export default SoilHarvestReportScreen;
