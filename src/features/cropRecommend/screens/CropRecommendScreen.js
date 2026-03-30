import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { fetchRecommendations } from '../slice/cropRecommendSlice';

// ─── Helpers ────────────────────────────────────────────────────────────────

const riskColors = {
  low: COLORS.success,
  medium: COLORS.warning,
  high: COLORS.danger,
};

const seasonColors = {
  Kharif: '#2196F3',
  Rabi: '#FF9800',
  Zaid: '#9C27B0',
};

const ScoreBar = ({ score }) => (
  <View style={styles.scoreBarContainer}>
    <View style={[styles.scoreBarFill, { width: `${score}%` }]} />
    <Text style={styles.scoreBarText}>{score}%</Text>
  </View>
);

// ─── Sub-components ─────────────────────────────────────────────────────────

const ParamCell = ({ icon, label, value, unit, color }) => (
  <View style={styles.paramCell}>
    <MaterialCommunityIcons name={icon} size={20} color={color || COLORS.primaryLight} />
    <Text style={styles.paramValue}>{value}{unit ? ` ${unit}` : ''}</Text>
    <Text style={styles.paramLabel}>{label}</Text>
  </View>
);

const RecommendationCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.recCard} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.recHeader}>
      <View style={styles.recIconWrap}>
        <MaterialCommunityIcons name={item.icon} size={28} color={COLORS.primaryLight} />
      </View>
      <View style={styles.recTitleArea}>
        <Text style={styles.recCropName}>{item.cropName}</Text>
        <View style={styles.recBadges}>
          <View style={[styles.badge, { backgroundColor: seasonColors[item.season] + '20' }]}>
            <Text style={[styles.badgeText, { color: seasonColors[item.season] }]}>{item.season}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: riskColors[item.riskLevel] + '20' }]}>
            <Text style={[styles.badgeText, { color: riskColors[item.riskLevel] }]}>
              {item.riskLevel.charAt(0).toUpperCase() + item.riskLevel.slice(1)} Risk
            </Text>
          </View>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textTertiary} />
    </View>

    <ScoreBar score={item.suitabilityScore} />

    <View style={styles.recDetails}>
      <View style={styles.recDetailItem}>
        <MaterialCommunityIcons name="chart-line" size={14} color={COLORS.textSecondary} />
        <Text style={styles.recDetailText}>{item.expectedYield}</Text>
      </View>
      <View style={styles.recDetailItem}>
        <MaterialCommunityIcons name="currency-inr" size={14} color={COLORS.textSecondary} />
        <Text style={styles.recDetailText}>{(item.investmentPerHa / 1000).toFixed(0)}K/ha</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Main Screen ────────────────────────────────────────────────────────────

const CropRecommendScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { recommendations, soilParams, climateParams, loading } = useSelector(
    (state) => state.cropRecommend,
  );

  useEffect(() => {
    if (!recommendations.length) {
      dispatch(fetchRecommendations());
    }
  }, [dispatch]);

  const soil = soilParams || {};
  const climate = climateParams || {};

  return (
    <ScreenLayout
      title={t('cropRecommend.title', { defaultValue: 'Crop Suitability' })}
      showBack
      onBack={() => navigation.goBack()}
    >
      {loading && (
        <ActivityIndicator size="large" color={COLORS.primaryLight} style={{ marginTop: SPACING.xxxl }} />
      )}

      {!loading && (
        <>
          {/* Soil Profile Card */}
          <Text style={styles.sectionTitle}>
            {t('cropRecommend.soilProfile', { defaultValue: 'Your Soil Profile' })}
          </Text>
          <View style={styles.card}>
            <View style={styles.paramGrid}>
              <ParamCell icon="atom" label="Nitrogen" value={soil.nitrogen ?? '--'} unit="kg/ha" color={COLORS.chartNPK_N} />
              <ParamCell icon="atom-variant" label="Phosphorus" value={soil.phosphorus ?? '--'} unit="kg/ha" color={COLORS.chartNPK_P} />
              <ParamCell icon="flask" label="Potassium" value={soil.potassium ?? '--'} unit="kg/ha" color={COLORS.chartNPK_K} />
              <ParamCell icon="ph" label="pH" value={soil.ph ?? '--'} color={COLORS.chartPH} />
            </View>
            {soil.texture && (
              <View style={styles.textureRow}>
                <MaterialCommunityIcons name="terrain" size={16} color={COLORS.textSecondary} />
                <Text style={styles.textureText}>
                  {t('cropRecommend.texture', { defaultValue: 'Texture' })}: {soil.texture}
                </Text>
                {soil.organicCarbon != null && (
                  <Text style={styles.textureText}> | OC: {soil.organicCarbon}%</Text>
                )}
              </View>
            )}
          </View>

          {/* Climate Profile Card */}
          <Text style={styles.sectionTitle}>
            {t('cropRecommend.climateProfile', { defaultValue: 'Climate Profile' })}
          </Text>
          <View style={styles.card}>
            <View style={styles.climateRow}>
              <ParamCell icon="weather-pouring" label="Rainfall" value={climate.rainfall ?? '--'} unit="mm" color={COLORS.info} />
              <ParamCell icon="thermometer" label="Avg Temp" value={climate.avgTemp ?? '--'} unit="°C" color={COLORS.danger} />
              <ParamCell icon="water-percent" label="Humidity" value={climate.humidity ?? '--'} unit="%" color={COLORS.chartMoisture} />
            </View>
          </View>

          {/* Edit Parameters Button */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('CropRecommendInput')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORS.primaryLight} />
            <Text style={styles.editButtonText}>
              {t('cropRecommend.editParams', { defaultValue: 'Edit Parameters' })}
            </Text>
          </TouchableOpacity>

          {/* Top Recommendations */}
          <Text style={styles.sectionTitle}>
            {t('cropRecommend.topRecs', { defaultValue: 'Top Recommendations' })}
          </Text>
          {recommendations.map((item) => (
            <RecommendationCard
              key={item.id}
              item={item}
              onPress={() => navigation.navigate('CropRecommendDetail', { crop: item })}
            />
          ))}

          {recommendations.length === 0 && !loading && (
            <Text style={styles.emptyText}>
              {t('cropRecommend.noRecs', { defaultValue: 'No recommendations yet. Add your soil and climate data to get started.' })}
            </Text>
          )}
        </>
      )}
    </ScreenLayout>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  paramGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  paramCell: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  paramValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  paramLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  textureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
  },
  textureText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  climateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySurface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  editButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primaryLight,
  },
  recCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  recIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  recTitleArea: {
    flex: 1,
  },
  recCropName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  recBadges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  badge: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  scoreBarContainer: {
    height: 22,
    backgroundColor: COLORS.primarySurface,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    justifyContent: 'center',
  },
  scoreBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
  },
  scoreBarText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    textAlign: 'center',
  },
  recDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  recDetailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xxxl,
    lineHeight: 22,
  },
});

export default CropRecommendScreen;
