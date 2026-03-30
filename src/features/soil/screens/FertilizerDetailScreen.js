import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import { fetchFertilizerHistory } from '../slice/soilSlice';
import { SOIL_CROPS, CROP_SOIL_RANGES } from '../mock/soilMockData';

// Deficiency symptoms database
const DEFICIENCY_SYMPTOMS = {
  nitrogen: {
    icon: 'leaf',
    color: '#8B6914',
    title: 'Nitrogen Deficiency',
    symptoms: 'Yellowing of older leaves (chlorosis), stunted growth, reduced tillering, pale green foliage',
  },
  phosphorus: {
    icon: 'flask',
    color: '#7B1FA2',
    title: 'Phosphorus Deficiency',
    symptoms: 'Purple/reddish discoloration on leaves, delayed maturity, poor root development, reduced flowering',
  },
  potassium: {
    icon: 'atom',
    color: '#BF360C',
    title: 'Potassium Deficiency',
    symptoms: 'Brown scorching on leaf edges (necrosis), weak stems prone to lodging, poor fruit quality',
  },
};

const MOCK_FERTILIZER_HISTORY = [
  { label: 'Mon', n: 42, p: 28, k: 22 },
  { label: 'Tue', n: 45, p: 30, k: 25 },
  { label: 'Wed', n: 48, p: 32, k: 20 },
  { label: 'Thu', n: 40, p: 27, k: 28 },
  { label: 'Fri', n: 45, p: 30, k: 25 },
  { label: 'Sat', n: 50, p: 35, k: 23 },
  { label: 'Sun', n: 44, p: 29, k: 26 },
];

const getNpkData = (t) => [
  { label: t('fertilizerDetail.nitrogen'), value: 45, color: COLORS.chartNPK_N, icon: 'leaf' },
  { label: t('fertilizerDetail.phosphorus'), value: 30, color: COLORS.chartNPK_P, icon: 'flask' },
  { label: t('fertilizerDetail.potassium'), value: 25, color: COLORS.chartNPK_K, icon: 'atom' },
];

const FertilizerDetailScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const soil = useSelector((state) => state.soil);
  const { t } = useTranslation();
  const NPK_DATA = getNpkData(t);
  const fertilizerHistory = soil.fertilizerHistory?.length > 0
    ? soil.fertilizerHistory
    : MOCK_FERTILIZER_HISTORY;
  const [activeTab, setActiveTab] = useState('Daily');
  const [selectedView, setSelectedView] = useState('NPK Overview');

  const currentN = soil.current?.nitrogen || 45;
  const currentP = soil.current?.phosphorus || 30;
  const currentK = soil.current?.potassium || 25;

  // Get selected crop info for recommended NPK
  const selectedCropId = soil.selectedCropId;
  const selectedCrop = SOIL_CROPS.find((c) => c.id === selectedCropId);
  const cropName = selectedCrop?.name || 'Wheat';
  const cropRanges = CROP_SOIL_RANGES[cropName] || CROP_SOIL_RANGES.Wheat;

  // Calculate NPK ratio
  const npkTotal = currentN + currentP + currentK;
  const npkRatio = npkTotal > 0
    ? `${currentN}:${currentP}:${currentK}`
    : '0:0:0';
  const recN = Math.round((cropRanges.nitrogen[0] + cropRanges.nitrogen[1]) / 2);
  const recP = Math.round((cropRanges.phosphorus[0] + cropRanges.phosphorus[1]) / 2);
  const recK = Math.round((cropRanges.potassium[0] + cropRanges.potassium[1]) / 2);
  const recommendedRatio = `${recN}:${recP}:${recK}`;

  // Check for deficiencies (below 30%)
  const deficiencies = [];
  if (currentN < 30) deficiencies.push('nitrogen');
  if (currentP < 30) deficiencies.push('phosphorus');
  if (currentK < 30) deficiencies.push('potassium');

  useEffect(() => {
    dispatch(fetchFertilizerHistory());
  }, [dispatch]);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('fertilizerDetail.title')}</Text>
      </View>

      {/* Crop Selector */}
      <View style={styles.viewSelector}>
        <TouchableOpacity
          style={[
            styles.viewTab,
            selectedView === 'Fertilizer K' && styles.viewTabActive,
          ]}
          onPress={() => setSelectedView('Fertilizer K')}
        >
          <Text
            style={[
              styles.viewTabText,
              selectedView === 'Fertilizer K' && styles.viewTabTextActive,
            ]}
          >
            {t('fertilizerDetail.fertilizerK')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewTab,
            selectedView === 'NPK Overview' && styles.viewTabActive,
          ]}
          onPress={() => setSelectedView('NPK Overview')}
        >
          <Text
            style={[
              styles.viewTabText,
              selectedView === 'NPK Overview' && styles.viewTabTextActive,
            ]}
          >
            {t('fertilizerDetail.npkOverview')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* NPK Concentration */}
      <View style={styles.npkCard}>
        <Text style={styles.cardTitle}>{t('fertilizerDetail.npkConcentration')}</Text>
        <Text style={styles.cardSubtitle}>{t('fertilizerDetail.currentNutrientLevels')}</Text>

        {NPK_DATA.map((nutrient, index) => (
          <View key={index} style={styles.npkItem}>
            <View style={styles.npkLabelRow}>
              <View style={styles.npkIconContainer}>
                <MaterialCommunityIcons name={nutrient.icon} size={18} color={nutrient.color} />
              </View>
              <Text style={styles.npkLabel}>{nutrient.label}</Text>
              <Text style={[styles.npkPercent, { color: nutrient.color }]}>{nutrient.value}%</Text>
            </View>
            <View style={styles.npkBarOuter}>
              <View
                style={[
                  styles.npkBarFill,
                  { width: `${nutrient.value}%`, backgroundColor: nutrient.color },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Chart Section */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{t('fertilizerDetail.fertilizerLevelGraph')}</Text>
          <View style={styles.chartTabs}>
            <TouchableOpacity
              style={activeTab === 'Daily' ? styles.chartTabActive : styles.chartTab}
              onPress={() => setActiveTab('Daily')}
            >
              <Text style={activeTab === 'Daily' ? styles.chartTabTextActive : styles.chartTabText}>
                {t('fertilizerDetail.daily')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={activeTab === 'Average' ? styles.chartTabActive : styles.chartTab}
              onPress={() => setActiveTab('Average')}
            >
              <Text style={activeTab === 'Average' ? styles.chartTabTextActive : styles.chartTabText}>
                {t('fertilizerDetail.average')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Grouped Bar Chart */}
        <View style={styles.chartArea}>
          <View style={styles.chartPlaceholder}>
            {fertilizerHistory.map((point, index) => (
              <View key={index} style={styles.chartBarGroup}>
                <View style={styles.chartBarsRow}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${point.n}%`,
                        backgroundColor: COLORS.chartNPK_N + '80',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${point.p}%`,
                        backgroundColor: COLORS.chartNPK_P + '80',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${point.k}%`,
                        backgroundColor: COLORS.chartNPK_K + '80',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartBarLabel}>{point.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.chartNPK_N }]} />
            <Text style={styles.legendText}>N</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.chartNPK_P }]} />
            <Text style={styles.legendText}>P</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.chartNPK_K }]} />
            <Text style={styles.legendText}>K</Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>{t('fertilizerDetail.recommendedVsActual')}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{`N (${t('fertilizerDetail.rec')})`}</Text>
            <Text style={[styles.statValue, { color: COLORS.chartNPK_N }]}>40-50%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{`N (${t('fertilizerDetail.act')})`}</Text>
            <Text style={[styles.statValue, { color: COLORS.chartNPK_N }]}>{currentN}%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{`P (${t('fertilizerDetail.rec')})`}</Text>
            <Text style={[styles.statValue, { color: COLORS.chartNPK_P }]}>25-35%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{`P (${t('fertilizerDetail.act')})`}</Text>
            <Text style={[styles.statValue, { color: COLORS.chartNPK_P }]}>{currentP}%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{`K (${t('fertilizerDetail.rec')})`}</Text>
            <Text style={[styles.statValue, { color: COLORS.chartNPK_K }]}>20-30%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{`K (${t('fertilizerDetail.act')})`}</Text>
            <Text style={[styles.statValue, { color: COLORS.chartNPK_K }]}>{currentK}%</Text>
          </View>
        </View>
      </View>

      {/* NPK Ratio Display */}
      <View style={styles.npkRatioCard}>
        <Text style={styles.sectionTitle}>NPK Ratio</Text>
        <Text style={styles.sectionSubtitle}>Current vs recommended for {cropName}</Text>
        <View style={styles.npkRatioRow}>
          <View style={styles.npkRatioItem}>
            <Text style={styles.npkRatioLabel}>Current</Text>
            <Text style={styles.npkRatioValue}>{npkRatio}</Text>
            <View style={styles.npkRatioBar}>
              <View style={[styles.npkRatioSegment, { flex: currentN, backgroundColor: COLORS.chartNPK_N }]} />
              <View style={[styles.npkRatioSegment, { flex: currentP, backgroundColor: COLORS.chartNPK_P }]} />
              <View style={[styles.npkRatioSegment, { flex: currentK, backgroundColor: COLORS.chartNPK_K }]} />
            </View>
          </View>
          <View style={styles.npkRatioDivider} />
          <View style={styles.npkRatioItem}>
            <Text style={styles.npkRatioLabel}>Recommended</Text>
            <Text style={[styles.npkRatioValue, { color: COLORS.primaryLight }]}>{recommendedRatio}</Text>
            <View style={styles.npkRatioBar}>
              <View style={[styles.npkRatioSegment, { flex: recN, backgroundColor: COLORS.chartNPK_N + '80' }]} />
              <View style={[styles.npkRatioSegment, { flex: recP, backgroundColor: COLORS.chartNPK_P + '80' }]} />
              <View style={[styles.npkRatioSegment, { flex: recK, backgroundColor: COLORS.chartNPK_K + '80' }]} />
            </View>
          </View>
        </View>
        <View style={styles.npkRatioLegend}>
          <View style={styles.npkRatioLegendItem}>
            <View style={[styles.npkRatioLegendDot, { backgroundColor: COLORS.chartNPK_N }]} />
            <Text style={styles.npkRatioLegendText}>N</Text>
          </View>
          <View style={styles.npkRatioLegendItem}>
            <View style={[styles.npkRatioLegendDot, { backgroundColor: COLORS.chartNPK_P }]} />
            <Text style={styles.npkRatioLegendText}>P</Text>
          </View>
          <View style={styles.npkRatioLegendItem}>
            <View style={[styles.npkRatioLegendDot, { backgroundColor: COLORS.chartNPK_K }]} />
            <Text style={styles.npkRatioLegendText}>K</Text>
          </View>
        </View>
      </View>

      {/* Deficiency Symptoms */}
      {deficiencies.length > 0 && (
        <View style={styles.deficiencyCard}>
          <View style={styles.deficiencyHeader}>
            <MaterialCommunityIcons name="alert-outline" size={22} color={COLORS.warning} />
            <Text style={styles.sectionTitle}>Nutrient Deficiency Alert</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            The following nutrients are below 30% — watch for these symptoms
          </Text>
          {deficiencies.map((key) => {
            const info = DEFICIENCY_SYMPTOMS[key];
            return (
              <View key={key} style={styles.deficiencyItem}>
                <View style={[styles.deficiencyIconCircle, { backgroundColor: info.color + '20' }]}>
                  <MaterialCommunityIcons name={info.icon} size={20} color={info.color} />
                </View>
                <View style={styles.deficiencyContent}>
                  <Text style={styles.deficiencyTitle}>{info.title}</Text>
                  <Text style={styles.deficiencySymptoms}>{info.symptoms}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Fertilizer Schedule */}
      <View style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <MaterialCommunityIcons name="calendar-clock" size={22} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Fertilizer Schedule</Text>
        </View>

        <View style={styles.scheduleItem}>
          <View style={styles.scheduleIconContainer}>
            <MaterialCommunityIcons name="arrow-right-circle" size={20} color={COLORS.primaryLight} />
          </View>
          <View style={styles.scheduleContent}>
            <Text style={styles.scheduleLabel}>Next Application</Text>
            <Text style={styles.scheduleValue}>Urea 50 kg/ha</Text>
            <Text style={styles.scheduleTime}>In 7 days</Text>
          </View>
          <View style={styles.scheduleBadge}>
            <Text style={styles.scheduleBadgeText}>Upcoming</Text>
          </View>
        </View>

        <View style={styles.scheduleDividerLine} />

        <View style={styles.scheduleItem}>
          <View style={[styles.scheduleIconContainer, { backgroundColor: '#E8F5E9' }]}>
            <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.primaryLight} />
          </View>
          <View style={styles.scheduleContent}>
            <Text style={styles.scheduleLabel}>Last Applied</Text>
            <Text style={styles.scheduleValue}>DAP 40 kg/ha</Text>
            <Text style={styles.scheduleTime}>14 days ago</Text>
          </View>
          <View style={[styles.scheduleBadge, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.scheduleBadgeText, { color: COLORS.primaryLight }]}>Done</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.full,
    padding: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  viewTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
  },
  viewTabActive: {
    backgroundColor: COLORS.primary,
  },
  viewTabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  viewTabTextActive: {
    color: COLORS.white,
  },
  npkCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  npkItem: {
    marginBottom: SPACING.lg,
  },
  npkLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  npkIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  npkLabel: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  npkPercent: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  npkBarOuter: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  npkBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  chartTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  chartTabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  chartTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  chartTabActive: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  chartTabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  chartTabTextActive: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.medium,
  },
  chartArea: {
    height: 160,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  chartPlaceholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.xs,
  },
  chartBarGroup: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  chartBar: {
    width: 8,
    borderRadius: 2,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginTop: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
  },
  statsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statItem: {
    width: '46%',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  // Shared section styles
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    marginTop: SPACING.xs,
  },
  // NPK Ratio Display
  npkRatioCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  npkRatioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  npkRatioItem: {
    flex: 1,
    alignItems: 'center',
  },
  npkRatioLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  npkRatioValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  npkRatioBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    width: '100%',
  },
  npkRatioSegment: {
    height: '100%',
  },
  npkRatioDivider: {
    width: 1,
    height: 80,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  npkRatioLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginTop: SPACING.lg,
  },
  npkRatioLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  npkRatioLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  npkRatioLegendText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  // Deficiency Symptoms
  deficiencyCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginTop: SPACING.xl,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  deficiencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  deficiencyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  deficiencyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  deficiencyContent: {
    flex: 1,
  },
  deficiencyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  deficiencySymptoms: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  // Fertilizer Schedule
  scheduleCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  scheduleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F8E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  scheduleValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  scheduleTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  scheduleBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#FFF3E0',
  },
  scheduleBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.warning,
  },
  scheduleDividerLine: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.md,
  },
});

export default FertilizerDetailScreen;
