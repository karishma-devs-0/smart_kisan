import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';

// ─── Helpers ────────────────────────────────────────────────────────────────

const riskColors = {
  low: COLORS.success,
  medium: COLORS.warning,
  high: COLORS.danger,
};

const waterIcons = {
  low: 'water-outline',
  medium: 'water',
  high: 'waves',
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const InfoCard = ({ icon, label, value, color }) => (
  <View style={styles.infoCard}>
    <View style={[styles.infoIconWrap, { backgroundColor: (color || COLORS.primaryLight) + '15' }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color || COLORS.primaryLight} />
    </View>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const ReasonItem = ({ text, index }) => (
  <View style={styles.reasonRow}>
    <View style={styles.reasonBullet}>
      <Text style={styles.reasonBulletText}>{index + 1}</Text>
    </View>
    <Text style={styles.reasonText}>{text}</Text>
  </View>
);

// ─── Main Screen ────────────────────────────────────────────────────────────

const CropRecommendDetailScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const crop = route.params?.crop;

  if (!crop) {
    return (
      <ScreenLayout title="Error" showBack onBack={() => navigation.goBack()}>
        <Text style={styles.errorText}>Crop data not found.</Text>
      </ScreenLayout>
    );
  }

  const riskColor = riskColors[crop.riskLevel] || COLORS.textTertiary;
  const riskLabel = crop.riskLevel.charAt(0).toUpperCase() + crop.riskLevel.slice(1);
  const waterLabel = crop.waterRequirement.charAt(0).toUpperCase() + crop.waterRequirement.slice(1);

  return (
    <ScreenLayout title={crop.cropName} showBack onBack={() => navigation.goBack()}>
      {/* Suitability Score */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNumber}>{crop.suitabilityScore}</Text>
          <Text style={styles.scorePercent}>%</Text>
        </View>
        <Text style={styles.scoreLabel}>
          {t('cropRecommend.suitability', { defaultValue: 'Suitability Score' })}
        </Text>
        <View style={styles.cropNameRow}>
          <MaterialCommunityIcons name={crop.icon} size={24} color={COLORS.primaryLight} />
          <Text style={styles.cropNameLarge}>{crop.cropName}</Text>
        </View>
      </View>

      {/* Info Cards Grid */}
      <View style={styles.infoGrid}>
        <InfoCard
          icon="calendar-month"
          label={t('cropRecommend.season', { defaultValue: 'Season' })}
          value={crop.season}
          color={COLORS.info}
        />
        <InfoCard
          icon="clock-outline"
          label={t('cropRecommend.growingDays', { defaultValue: 'Growing Days' })}
          value={`${crop.growingDays} days`}
          color={COLORS.primaryLight}
        />
        <InfoCard
          icon={waterIcons[crop.waterRequirement] || 'water'}
          label={t('cropRecommend.water', { defaultValue: 'Water Need' })}
          value={waterLabel}
          color={COLORS.chartMoisture}
        />
        <InfoCard
          icon="shield-alert-outline"
          label={t('cropRecommend.risk', { defaultValue: 'Risk Level' })}
          value={riskLabel}
          color={riskColor}
        />
      </View>

      {/* Yield & Investment */}
      <View style={styles.yieldCard}>
        <View style={styles.yieldRow}>
          <View style={styles.yieldItem}>
            <MaterialCommunityIcons name="chart-line" size={20} color={COLORS.success} />
            <View style={styles.yieldTextArea}>
              <Text style={styles.yieldLabel}>
                {t('cropRecommend.expectedYield', { defaultValue: 'Expected Yield' })}
              </Text>
              <Text style={styles.yieldValue}>{crop.expectedYield}</Text>
            </View>
          </View>
          <View style={styles.yieldDivider} />
          <View style={styles.yieldItem}>
            <MaterialCommunityIcons name="currency-inr" size={20} color={COLORS.warning} />
            <View style={styles.yieldTextArea}>
              <Text style={styles.yieldLabel}>
                {t('cropRecommend.investment', { defaultValue: 'Investment/ha' })}
              </Text>
              <Text style={styles.yieldValue}>
                {'\u20B9'}{crop.investmentPerHa.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Why This Crop? */}
      <Text style={styles.sectionTitle}>
        {t('cropRecommend.whyThisCrop', { defaultValue: 'Why This Crop?' })}
      </Text>
      <View style={styles.reasonsCard}>
        {crop.reasons.map((reason, index) => (
          <ReasonItem key={index} text={reason} index={index} />
        ))}
      </View>

      <View style={{ height: SPACING.xxl }} />
    </ScreenLayout>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scoreSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 4,
    borderColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  scoreNumber: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  scorePercent: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primaryLight,
    marginTop: 4,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  cropNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  cropNameLarge: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  infoCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  yieldCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
    ...SHADOWS.sm,
  },
  yieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yieldItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  yieldTextArea: {
    flex: 1,
  },
  yieldLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  yieldValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  yieldDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  reasonsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  reasonBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    marginTop: 1,
  },
  reasonBulletText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  reasonText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.danger,
    textAlign: 'center',
    marginTop: SPACING.xxxl,
  },
});

export default CropRecommendDetailScreen;
