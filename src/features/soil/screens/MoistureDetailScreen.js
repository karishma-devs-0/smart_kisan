import React, { useEffect } from 'react';
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
import { fetchMoistureHistory } from '../slice/soilSlice';
import { SOIL_CROPS, CROP_SOIL_RANGES } from '../mock/soilMockData';

// Field capacity zones for moisture bar
const MOISTURE_ZONES = [
  { label: 'Wilting Point', range: [0, 15], color: '#D32F2F' },
  { label: 'Stress Zone', range: [15, 30], color: '#FF9800' },
  { label: 'Available Water', range: [30, 60], color: '#4CAF50' },
  { label: 'Field Capacity', range: [60, 80], color: '#2196F3' },
  { label: 'Saturation', range: [80, 100], color: '#7B1FA2' },
];

const MoistureDetailScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const soil = useSelector((state) => state.soil);
  const { t } = useTranslation();
  const moistureHistory = soil.moistureHistory || [];
  const currentMoisture = soil.current?.moisture || 45;

  // Get selected crop info
  const selectedCropId = soil.selectedCropId;
  const selectedCrop = SOIL_CROPS.find((c) => c.id === selectedCropId);
  const cropName = selectedCrop?.name || 'Wheat';
  const cropRanges = CROP_SOIL_RANGES[cropName] || CROP_SOIL_RANGES.Wheat;
  const optimalMin = cropRanges.moisture[0];
  const optimalMax = cropRanges.moisture[1];
  const needsIrrigation = currentMoisture < 35;

  useEffect(() => {
    dispatch(fetchMoistureHistory());
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
        <Text style={styles.title}>{t('moistureDetail.title')}</Text>
      </View>

      {/* Crop indicator */}
      <View style={styles.cropTag}>
        <MaterialCommunityIcons name="sprout" size={16} color={COLORS.primaryLight} />
        <Text style={styles.cropName}>Bell Pepper</Text>
      </View>

      {/* Soil Moisture Content */}
      <View style={styles.moistureCard}>
        <Text style={styles.cardTitle}>{t('moistureDetail.soilMoistureContent')}</Text>
        <Text style={styles.moistureSubtitle}>{t('moistureDetail.currentLevel')}</Text>
        <View style={styles.gaugeContainer}>
          <View style={styles.gaugeOuter}>
            <View style={[styles.gaugeFill, { width: `${currentMoisture}%` }]} />
          </View>
          <Text style={styles.gaugeText}>{currentMoisture}%</Text>
        </View>
        <View style={styles.gaugeLabels}>
          <Text style={styles.gaugeLabelLow}>0%</Text>
          <Text style={styles.gaugeLabelHigh}>100%</Text>
        </View>
      </View>

      {/* Chart Placeholder */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{t('moistureDetail.moistureOverTime')}</Text>
          <View style={styles.chartTabs}>
            <TouchableOpacity style={styles.chartTabActive}>
              <Text style={styles.chartTabTextActive}>{t('moistureDetail.daily')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chartTab}>
              <Text style={styles.chartTabText}>{t('moistureDetail.average')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Chart area */}
        <View style={styles.chartArea}>
          {moistureHistory.length > 0 ? (
            <View style={styles.chartPlaceholder}>
              {moistureHistory.map((point, index) => (
                <View
                  key={index}
                  style={[
                    styles.chartBar,
                    {
                      height: `${point.value}%`,
                      backgroundColor: COLORS.chartMoisture + '80',
                    },
                  ]}
                />
              ))}
            </View>
          ) : (
            <View style={styles.chartEmpty}>
              <MaterialCommunityIcons name="chart-line" size={48} color={COLORS.textSecondary} />
              <Text style={styles.chartEmptyText}>{t('moistureDetail.loadingChart')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('moistureDetail.average')}</Text>
          <Text style={styles.statValue}>47%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('moistureDetail.min')}</Text>
          <Text style={styles.statValue}>38%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('moistureDetail.max')}</Text>
          <Text style={styles.statValue}>55%</Text>
        </View>
      </View>

      {/* Field Capacity Indicator */}
      <View style={styles.fieldCapacityCard}>
        <Text style={styles.cardTitle}>Field Capacity Indicator</Text>
        <Text style={styles.fieldCapacitySubtitle}>Soil water availability zones</Text>

        <View style={styles.fieldCapacityBarContainer}>
          {/* Zone bar */}
          <View style={styles.fieldCapacityBar}>
            {MOISTURE_ZONES.map((zone, index) => (
              <View
                key={index}
                style={[
                  styles.fieldCapacitySegment,
                  {
                    flex: zone.range[1] - zone.range[0],
                    backgroundColor: zone.color,
                    borderTopLeftRadius: index === 0 ? 6 : 0,
                    borderBottomLeftRadius: index === 0 ? 6 : 0,
                    borderTopRightRadius: index === MOISTURE_ZONES.length - 1 ? 6 : 0,
                    borderBottomRightRadius: index === MOISTURE_ZONES.length - 1 ? 6 : 0,
                  },
                ]}
              />
            ))}
          </View>

          {/* Current moisture marker (arrow) */}
          <View style={[styles.moistureMarker, { left: `${Math.min(Math.max(currentMoisture, 0), 100)}%` }]}>
            <Text style={styles.moistureMarkerText}>{currentMoisture}%</Text>
            <View style={styles.moistureMarkerArrow} />
          </View>
        </View>

        {/* Zone labels */}
        <View style={styles.zoneLabelsContainer}>
          {MOISTURE_ZONES.map((zone, index) => (
            <View key={index} style={styles.zoneLabelItem}>
              <View style={[styles.zoneLabelDot, { backgroundColor: zone.color }]} />
              <Text style={styles.zoneLabelText}>
                {zone.label} ({zone.range[0]}-{zone.range[1]}%)
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Crop-Specific Optimal Range */}
      <View style={styles.cropOptimalCard}>
        <View style={styles.cropOptimalHeader}>
          <MaterialCommunityIcons name="sprout" size={20} color={COLORS.primaryLight} />
          <Text style={styles.cropOptimalTitle}>Optimal Range for {cropName}</Text>
        </View>
        <View style={styles.cropOptimalBarContainer}>
          <View style={styles.cropOptimalBarBg}>
            <View
              style={[
                styles.cropOptimalRange,
                {
                  left: `${optimalMin}%`,
                  width: `${optimalMax - optimalMin}%`,
                },
              ]}
            />
            <View
              style={[
                styles.cropCurrentDot,
                {
                  left: `${Math.min(Math.max(currentMoisture, 0), 100)}%`,
                },
              ]}
            />
          </View>
          <View style={styles.cropOptimalLabels}>
            <Text style={styles.cropOptimalLabelText}>0%</Text>
            <Text style={styles.cropOptimalLabelText}>
              {optimalMin}%-{optimalMax}% optimal
            </Text>
            <Text style={styles.cropOptimalLabelText}>100%</Text>
          </View>
        </View>
        <Text style={styles.cropOptimalStatus}>
          {currentMoisture >= optimalMin && currentMoisture <= optimalMax
            ? `Current moisture (${currentMoisture}%) is within the optimal range for ${cropName}.`
            : currentMoisture < optimalMin
            ? `Current moisture (${currentMoisture}%) is below the optimal range (${optimalMin}-${optimalMax}%) for ${cropName}. Consider irrigating.`
            : `Current moisture (${currentMoisture}%) is above the optimal range (${optimalMin}-${optimalMax}%) for ${cropName}. Allow soil to drain.`}
        </Text>
      </View>

      {/* Irrigation Recommendation */}
      {needsIrrigation && (
        <View style={styles.irrigationWarningCard}>
          <View style={styles.irrigationWarningHeader}>
            <MaterialCommunityIcons name="alert-circle" size={24} color={COLORS.danger} />
            <Text style={styles.irrigationWarningTitle}>Irrigation Needed</Text>
          </View>
          <Text style={styles.irrigationWarningText}>
            Soil moisture is at {currentMoisture}%, which is below the critical threshold of 35%.
            Irrigate within 24 hours to prevent crop stress and potential yield loss.
          </Text>
          <View style={styles.irrigationWarningActions}>
            <MaterialCommunityIcons name="water-pump" size={18} color={COLORS.danger} />
            <Text style={styles.irrigationWarningAction}>
              Recommended: Apply 25-30mm of water via drip or sprinkler irrigation
            </Text>
          </View>
        </View>
      )}
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
    paddingBottom: 120,
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
  cropTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  cropName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primaryLight,
    fontWeight: FONT_WEIGHTS.medium,
  },
  moistureCard: {
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
  moistureSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  gaugeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  gaugeOuter: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: COLORS.chartMoisture,
  },
  gaugeText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.chartMoisture,
    minWidth: 50,
    textAlign: 'right',
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    marginRight: 62,
  },
  gaugeLabelLow: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  gaugeLabelHigh: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
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
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chartTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  chartTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.full,
    padding: 2,
  },
  chartTab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  chartTabActive: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
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
    paddingHorizontal: SPACING.sm,
  },
  chartBar: {
    flex: 1,
    maxWidth: 30,
    borderRadius: 4,
    minHeight: 8,
    marginHorizontal: 2,
  },
  chartEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.chartMoisture,
  },
  // Field Capacity Indicator
  fieldCapacityCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  fieldCapacitySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  fieldCapacityBarContainer: {
    position: 'relative',
    paddingBottom: SPACING.lg,
    marginBottom: SPACING.md,
  },
  fieldCapacityBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fieldCapacitySegment: {
    height: '100%',
  },
  moistureMarker: {
    position: 'absolute',
    bottom: -2,
    alignItems: 'center',
    marginLeft: -12,
  },
  moistureMarkerText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  moistureMarkerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.textPrimary,
  },
  zoneLabelsContainer: {
    marginTop: SPACING.sm,
  },
  zoneLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  zoneLabelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  zoneLabelText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  // Crop Optimal Range
  cropOptimalCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  cropOptimalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  cropOptimalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  cropOptimalBarContainer: {
    marginBottom: SPACING.md,
  },
  cropOptimalBarBg: {
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.background,
    position: 'relative',
    overflow: 'hidden',
  },
  cropOptimalRange: {
    position: 'absolute',
    top: 0,
    height: '100%',
    backgroundColor: '#4CAF5040',
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    borderRadius: 7,
  },
  cropCurrentDot: {
    position: 'absolute',
    top: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.chartMoisture,
    borderWidth: 2,
    borderColor: COLORS.white,
    marginLeft: -8,
  },
  cropOptimalLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  cropOptimalLabelText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  cropOptimalStatus: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  // Irrigation Warning
  irrigationWarningCard: {
    backgroundColor: '#FFF3F0',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginTop: SPACING.xl,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  irrigationWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  irrigationWarningTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.danger,
  },
  irrigationWarningText: {
    fontSize: FONT_SIZES.sm,
    color: '#B71C1C',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  irrigationWarningActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: '#FFCDD2',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  irrigationWarningAction: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: '#B71C1C',
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: 18,
  },
});

export default MoistureDetailScreen;
