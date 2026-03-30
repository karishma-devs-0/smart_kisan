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
import { fetchPhHistory } from '../slice/soilSlice';

// Crop pH suitability ranges
const CROP_PH_RANGES = [
  { name: 'Rice', min: 5.5, max: 6.5, color: '#8BC34A' },
  { name: 'Wheat', min: 6.0, max: 7.5, color: '#FFC107' },
  { name: 'Tomato', min: 6.0, max: 6.8, color: '#F44336' },
  { name: 'Potato', min: 5.0, max: 6.0, color: '#795548' },
  { name: 'Cotton', min: 6.0, max: 7.5, color: '#9E9E9E' },
];

const MOCK_PH_HISTORY = [
  { label: 'Mon', value: 6.2 },
  { label: 'Tue', value: 6.5 },
  { label: 'Wed', value: 6.8 },
  { label: 'Thu', value: 6.3 },
  { label: 'Fri', value: 6.5 },
  { label: 'Sat', value: 6.7 },
  { label: 'Sun', value: 6.4 },
];

const PhDetailScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const soil = useSelector((state) => state.soil);
  const { t } = useTranslation();
  const phHistory = soil.phHistory?.length > 0 ? soil.phHistory : MOCK_PH_HISTORY;
  const currentPh = soil.current?.pH || 6.5;
  const [activeTab, setActiveTab] = useState('Daily');

  useEffect(() => {
    dispatch(fetchPhHistory());
  }, [dispatch]);

  const phPosition = (currentPh / 14) * 100;

  const getPhColor = (ph) => {
    if (ph < 4) return '#F44336';
    if (ph < 6) return '#FF9800';
    if (ph <= 7) return '#4CAF50';
    if (ph <= 8) return '#2196F3';
    return '#9C27B0';
  };

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
        <Text style={styles.title}>{t('phDetail.title')}</Text>
      </View>

      {/* Crop indicator */}
      <View style={styles.cropTag}>
        <MaterialCommunityIcons name="sprout" size={16} color={COLORS.primaryLight} />
        <Text style={styles.cropName}>Bell Pepper</Text>
      </View>

      {/* pH Level Card */}
      <View style={styles.phCard}>
        <Text style={styles.cardTitle}>{t('phDetail.soilPh')}</Text>
        <View style={styles.phValueRow}>
          <Text style={styles.phValue}>{currentPh}</Text>
          <Text style={styles.phUnit}>{' ' + t('phDetail.molPerL')}</Text>
        </View>
        <Text style={styles.phDescription}>
          {t('phDetail.recommendedPh')}
        </Text>

        {/* pH Level Bar */}
        <View style={styles.phBarContainer}>
          <View style={styles.phBar}>
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#F44336' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#FF5722' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#FF9800' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#FFC107' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#CDDC39' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#4CAF50' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#009688' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#00BCD4' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#2196F3' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#3F51B5' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#673AB7' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#9C27B0' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#E91E63' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#880E4F' }]} />
          </View>
          {/* Marker */}
          <View style={[styles.phMarker, { left: `${phPosition}%` }]}>
            <View style={styles.phMarkerTriangle} />
            <Text style={styles.phMarkerText}>{currentPh}</Text>
          </View>
        </View>
        <View style={styles.phBarLabels}>
          <Text style={styles.phBarLabel}>0</Text>
          <Text style={styles.phBarLabel}>{t('phDetail.acidic')}</Text>
          <Text style={styles.phBarLabel}>7</Text>
          <Text style={styles.phBarLabel}>{t('phDetail.alkaline')}</Text>
          <Text style={styles.phBarLabel}>14</Text>
        </View>
      </View>

      {/* Chart Section */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{t('phDetail.phGraphOverTime')}</Text>
          <View style={styles.chartTabs}>
            <TouchableOpacity
              style={activeTab === 'Daily' ? styles.chartTabActive : styles.chartTab}
              onPress={() => setActiveTab('Daily')}
            >
              <Text style={activeTab === 'Daily' ? styles.chartTabTextActive : styles.chartTabText}>
                {t('phDetail.daily')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={activeTab === 'Average' ? styles.chartTabActive : styles.chartTab}
              onPress={() => setActiveTab('Average')}
            >
              <Text style={activeTab === 'Average' ? styles.chartTabTextActive : styles.chartTabText}>
                {t('phDetail.average')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartArea}>
          <View style={styles.chartPlaceholder}>
            {phHistory.map((point, index) => (
              <View key={index} style={styles.chartBarWrapper}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: `${(point.value / 14) * 100}%`,
                      backgroundColor: getPhColor(point.value),
                    },
                  ]}
                />
                <Text style={styles.chartBarLabel}>{point.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Soil Image Placeholder */}
      <View style={styles.soilImageCard}>
        <View style={styles.soilImagePlaceholder}>
          <MaterialCommunityIcons name="sprout" size={48} color={COLORS.primaryLight} />
          <Text style={styles.soilImageText}>{t('phDetail.soilSample')}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('phDetail.average')}</Text>
          <Text style={styles.statValue}>6.5</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('phDetail.min')}</Text>
          <Text style={styles.statValue}>6.2</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('phDetail.max')}</Text>
          <Text style={styles.statValue}>6.8</Text>
        </View>
      </View>

      {/* Amendment Calculator */}
      {currentPh < 6.0 ? (
        <View style={styles.amendmentCard}>
          <View style={styles.amendmentHeader}>
            <MaterialCommunityIcons name="flask-outline" size={24} color={COLORS.warning} />
            <Text style={styles.amendmentTitle}>Lime Needed</Text>
          </View>
          <Text style={styles.amendmentDescription}>
            Your soil pH ({currentPh}) is too acidic. Applying agricultural lime will raise the pH to a more
            suitable level for most crops.
          </Text>
          <View style={styles.amendmentDosage}>
            <MaterialCommunityIcons name="scale-balance" size={20} color={COLORS.warning} />
            <Text style={styles.amendmentDosageText}>
              Apply agricultural lime at{' '}
              <Text style={styles.amendmentDosageHighlight}>
                {((6.5 - currentPh) * 2).toFixed(1)} tons/ha
              </Text>
            </Text>
          </View>
          <Text style={styles.amendmentNote}>
            Target pH: 6.5 | Apply 2-4 weeks before planting. Work into top 15cm of soil.
          </Text>
        </View>
      ) : currentPh > 7.5 ? (
        <View style={[styles.amendmentCard, { borderLeftColor: COLORS.info }]}>
          <View style={styles.amendmentHeader}>
            <MaterialCommunityIcons name="flask-outline" size={24} color={COLORS.info} />
            <Text style={[styles.amendmentTitle, { color: COLORS.info }]}>Sulfur Needed</Text>
          </View>
          <Text style={styles.amendmentDescription}>
            Your soil pH ({currentPh}) is too alkaline. Applying elemental sulfur will gradually lower
            the pH to improve nutrient availability.
          </Text>
          <View style={[styles.amendmentDosage, { backgroundColor: '#E3F2FD' }]}>
            <MaterialCommunityIcons name="scale-balance" size={20} color={COLORS.info} />
            <Text style={styles.amendmentDosageText}>
              Apply sulfur at{' '}
              <Text style={[styles.amendmentDosageHighlight, { color: COLORS.info }]}>
                {((currentPh - 6.5) * 150).toFixed(0)} kg/ha
              </Text>
            </Text>
          </View>
          <Text style={styles.amendmentNote}>
            Target pH: 6.5 | Apply in split doses. Effect visible after 2-3 months.
          </Text>
        </View>
      ) : (
        <View style={[styles.amendmentCard, { borderLeftColor: COLORS.primaryLight }]}>
          <View style={styles.amendmentHeader}>
            <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.primaryLight} />
            <Text style={[styles.amendmentTitle, { color: COLORS.primaryLight }]}>pH is Optimal</Text>
          </View>
          <Text style={styles.amendmentDescription}>
            Your soil pH ({currentPh}) is within the optimal range (6.0-7.5) for most crops.
            No amendments are needed at this time. Continue monitoring regularly.
          </Text>
        </View>
      )}

      {/* Crop Suitability at Current pH */}
      <View style={styles.cropSuitabilityCard}>
        <Text style={styles.cardTitle}>Crop Suitability at pH {currentPh}</Text>
        <Text style={styles.cropSuitabilitySubtitle}>
          Which crops grow well at your current soil pH
        </Text>

        {/* pH scale with crop dots */}
        <View style={styles.cropPhScaleContainer}>
          <View style={styles.cropPhScale}>
            {/* pH bar segments 0-14 */}
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#F44336' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#FF5722' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#FF9800' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#FFC107' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#CDDC39' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#4CAF50' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#009688' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#00BCD4' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#2196F3' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#3F51B5' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#673AB7' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#9C27B0' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#E91E63' }]} />
            <View style={[styles.phSegment, { flex: 1, backgroundColor: '#880E4F' }]} />
          </View>

          {/* Current pH marker on scale */}
          <View style={[styles.cropPhMarker, { left: `${(currentPh / 14) * 100}%` }]}>
            <View style={styles.cropPhMarkerLine} />
          </View>

          {/* Crop range bars overlaid */}
          {CROP_PH_RANGES.map((crop, index) => {
            const leftPos = (crop.min / 14) * 100;
            const widthPos = ((crop.max - crop.min) / 14) * 100;
            const isSuitable = currentPh >= crop.min && currentPh <= crop.max;
            return (
              <View
                key={index}
                style={[
                  styles.cropRangeBar,
                  {
                    top: 24 + index * 28,
                    left: `${leftPos}%`,
                    width: `${widthPos}%`,
                    backgroundColor: isSuitable ? crop.color + '40' : '#E0E0E0' + '60',
                    borderColor: isSuitable ? crop.color : '#BDBDBD',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cropRangeLabel,
                    { color: isSuitable ? crop.color : '#999' },
                  ]}
                  numberOfLines={1}
                >
                  {crop.name}
                </Text>
              </View>
            );
          })}
        </View>

        {/* pH scale labels */}
        <View style={styles.cropPhLabels}>
          <Text style={styles.phBarLabel}>0</Text>
          <Text style={styles.phBarLabel}>3.5</Text>
          <Text style={styles.phBarLabel}>7</Text>
          <Text style={styles.phBarLabel}>10.5</Text>
          <Text style={styles.phBarLabel}>14</Text>
        </View>

        {/* Crop suitability list */}
        <View style={styles.cropSuitabilityList}>
          {CROP_PH_RANGES.map((crop, index) => {
            const isSuitable = currentPh >= crop.min && currentPh <= crop.max;
            return (
              <View key={index} style={styles.cropSuitabilityItem}>
                <View style={[styles.cropSuitabilityDot, { backgroundColor: crop.color }]} />
                <Text style={styles.cropSuitabilityName}>{crop.name}</Text>
                <Text style={styles.cropSuitabilityRange}>pH {crop.min}-{crop.max}</Text>
                <MaterialCommunityIcons
                  name={isSuitable ? 'check-circle' : 'close-circle'}
                  size={18}
                  color={isSuitable ? COLORS.primaryLight : '#BDBDBD'}
                />
              </View>
            );
          })}
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
  phCard: {
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
  phValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },
  phValue: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.chartPH,
  },
  phUnit: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  phDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
  },
  phBarContainer: {
    marginBottom: SPACING.sm,
    position: 'relative',
    paddingTop: SPACING.xxl,
  },
  phBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  phSegment: {
    height: '100%',
  },
  phMarker: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    marginLeft: -12,
  },
  phMarkerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.textPrimary,
  },
  phMarkerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: 2,
  },
  phBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  phBarLabel: {
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
    paddingHorizontal: SPACING.sm,
  },
  chartBarWrapper: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 24,
    borderRadius: 4,
    minHeight: 8,
  },
  chartBarLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  soilImageCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  soilImagePlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soilImageText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.chartPH,
  },
  // Amendment Calculator
  amendmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginTop: SPACING.xl,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  amendmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  amendmentTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.warning,
  },
  amendmentDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  amendmentDosage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FFF3E0',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  amendmentDosageText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  amendmentDosageHighlight: {
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.warning,
    fontSize: FONT_SIZES.lg,
  },
  amendmentNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  // Crop Suitability
  cropSuitabilityCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  cropSuitabilitySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  cropPhScaleContainer: {
    position: 'relative',
    height: 24 + 5 * 28 + 8,
    marginBottom: SPACING.sm,
  },
  cropPhScale: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cropPhMarker: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 24 + 5 * 28,
    marginLeft: -1,
  },
  cropPhMarkerLine: {
    width: 2,
    height: '100%',
    backgroundColor: COLORS.textPrimary,
  },
  cropRangeBar: {
    position: 'absolute',
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  cropRangeLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'center',
  },
  cropPhLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  cropSuitabilityList: {
    gap: SPACING.sm,
  },
  cropSuitabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
  },
  cropSuitabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  cropSuitabilityName: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
  },
  cropSuitabilityRange: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
});

export default PhDetailScreen;
