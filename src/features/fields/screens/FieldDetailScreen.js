import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';

const STAGE_COLORS = {
  seedling: COLORS.info,
  vegetative: COLORS.success,
  flowering: COLORS.warning,
  maturity: '#FF9800',
};

const STAGES = ['seedling', 'vegetative', 'flowering', 'maturity'];
const STAGE_LABEL_KEYS = ['fields.detail.stages.seedling', 'fields.detail.stages.vegetative', 'fields.detail.stages.flowering', 'fields.detail.stages.maturity'];

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getDaysSinceSowing = (sowingDate) => {
  const sowing = new Date(sowingDate);
  const now = new Date();
  const diffTime = Math.abs(now - sowing);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const InfoGridItem = ({ icon, iconColor, label, value }) => (
  <View style={styles.infoGridItem}>
    <View style={[styles.infoGridIconContainer, { backgroundColor: iconColor + '15' }]}>
      <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
    </View>
    <Text style={styles.infoGridLabel}>{label}</Text>
    <Text style={styles.infoGridValue} numberOfLines={1}>{value}</Text>
  </View>
);

const ActionButton = ({ icon, label, onPress, variant }) => {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        isPrimary ? styles.actionButtonPrimary : styles.actionButtonOutline,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={isPrimary ? COLORS.white : COLORS.primary}
      />
      <Text style={[styles.actionButtonText, isPrimary ? styles.actionButtonTextPrimary : styles.actionButtonTextOutline]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const FieldDetailScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { field } = route.params || {};
  const insets = useSafeAreaInsets();

  const stageColor = STAGE_COLORS[field.growthStage] || COLORS.textTertiary;
  const currentStageIndex = STAGES.indexOf(field.growthStage);
  const daysSinceSowing = getDaysSinceSowing(field.sowingDate);

  const handleAction = (action) => {
    const irrigationLabel = t('fields.detail.irrigationSchedule');
    const soilLabel = t('fields.detail.viewSoilData');
    const editLabel = t('fields.detail.editField');

    if (action === irrigationLabel) {
      navigation.navigate('PumpStack', { screen: 'MyPumps' });
    } else if (action === soilLabel) {
      navigation.navigate('SoilTab');
    } else {
      Alert.alert(
        action,
        t('fields.detail.comingSoon', {
          defaultValue: `"{{action}}" for {{fieldName}} is coming soon. Stay tuned for updates!`,
          action,
          fieldName: field.name,
        }),
        [{ text: t('common.ok', 'OK') }],
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{field.name}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Field Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View style={styles.overviewInfo}>
              <Text style={styles.overviewName}>{field.name}</Text>
              <Text style={styles.overviewArea}>{field.area} acres</Text>
            </View>
            <View style={[
              styles.overviewStatusBadge,
              { backgroundColor: (field.status === 'active' ? COLORS.success : field.status === 'harvested' ? COLORS.warning : COLORS.textTertiary) + '20' },
            ]}>
              <Text style={[
                styles.overviewStatusText,
                { color: field.status === 'active' ? COLORS.success : field.status === 'harvested' ? COLORS.warning : COLORS.textTertiary },
              ]}>
                {field.status.charAt(0).toUpperCase() + field.status.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.overviewCropRow}>
            <MaterialCommunityIcons name="sprout" size={18} color={COLORS.primaryLight} />
            <Text style={styles.overviewCropName}>{field.crop}</Text>
          </View>
        </View>

        {/* Growth Progress Section */}
        <Text style={styles.sectionTitle}>{t('fields.growthProgress')}</Text>
        <View style={styles.growthProgressCard}>
          {/* Progress bar */}
          <View style={styles.growthProgressBarContainer}>
            <View
              style={[
                styles.growthProgressBarFill,
                {
                  width: `${Math.min(field.growthProgress, 100)}%`,
                  backgroundColor: stageColor,
                },
              ]}
            />
          </View>
          <Text style={styles.growthProgressText}>{field.growthProgress}%</Text>

          {/* Stage labels */}
          <View style={styles.stageLabelsRow}>
            {STAGES.map((stage, index) => {
              const isActive = index === currentStageIndex;
              const isPast = index < currentStageIndex;
              const labelColor = isActive
                ? STAGE_COLORS[stage]
                : isPast
                  ? COLORS.textSecondary
                  : COLORS.textTertiary;

              return (
                <View key={stage} style={styles.stageLabelItem}>
                  <View
                    style={[
                      styles.stageDot,
                      {
                        backgroundColor: isActive ? STAGE_COLORS[stage] : isPast ? COLORS.textSecondary : COLORS.divider,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.stageLabelText,
                      {
                        color: labelColor,
                        fontWeight: isActive ? FONT_WEIGHTS.semiBold : FONT_WEIGHTS.regular,
                      },
                    ]}
                  >
                    {t(STAGE_LABEL_KEYS[index])}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Field Info Grid */}
        <Text style={styles.sectionTitle}>{t('fields.detail.fieldInfo')}</Text>
        <View style={styles.infoGrid}>
          <InfoGridItem
            icon="terrain"
            iconColor="#795548"
            label={t('fields.detail.soilType')}
            value={field.soilType}
          />
          <InfoGridItem
            icon="water-outline"
            iconColor={COLORS.info}
            label={t('fields.detail.irrigation')}
            value={field.irrigationType.charAt(0).toUpperCase() + field.irrigationType.slice(1)}
          />
          <InfoGridItem
            icon="calendar-star"
            iconColor={COLORS.success}
            label={t('fields.detail.sowingDate')}
            value={formatDate(field.sowingDate)}
          />
          <InfoGridItem
            icon="leaf"
            iconColor={stageColor}
            label={t('fields.detail.growthStage')}
            value={field.growthStage.charAt(0).toUpperCase() + field.growthStage.slice(1)}
          />
          <InfoGridItem
            icon="clock-outline"
            iconColor={COLORS.textSecondary}
            label={t('fields.detail.lastIrrigation')}
            value={formatDate(field.lastIrrigation)}
          />
          <InfoGridItem
            icon="clock-fast"
            iconColor={COLORS.primary}
            label={t('fields.detail.nextIrrigation')}
            value={formatDate(field.nextIrrigation)}
          />
        </View>

        {/* Crop Details Card */}
        <Text style={styles.sectionTitle}>{t('fields.detail.cropDetails')}</Text>
        <View style={styles.cropDetailsCard}>
          <View style={styles.cropDetailsRow}>
            <View style={styles.cropDetailsIconContainer}>
              <MaterialCommunityIcons name="sprout" size={32} color={COLORS.primaryLight} />
            </View>
            <View style={styles.cropDetailsInfo}>
              <Text style={styles.cropDetailsName}>{field.crop}</Text>
              <Text style={styles.cropDetailsStage}>
                {t('fields.detail.stage')}: {field.growthStage.charAt(0).toUpperCase() + field.growthStage.slice(1)}
              </Text>
              <Text style={styles.cropDetailsDays}>
                {t('fields.detail.daysSinceSowing', { days: daysSinceSowing })}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Card */}
        <Text style={styles.sectionTitle}>{t('fields.detail.location')}</Text>
        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <View style={[styles.locationIconContainer, { backgroundColor: COLORS.warning + '15' }]}>
              <MaterialCommunityIcons name="map-marker" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>{t('fields.detail.latitude')}</Text>
              <Text style={styles.locationValue}>{field.location.lat}</Text>
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>{t('fields.detail.longitude')}</Text>
              <Text style={styles.locationValue}>{field.location.lng}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <ActionButton
            icon="pencil-outline"
            label={t('fields.detail.editField')}
            onPress={() => handleAction(t('fields.detail.editField'))}
            variant="primary"
          />
          <ActionButton
            icon="test-tube"
            label={t('fields.detail.viewSoilData')}
            onPress={() => handleAction(t('fields.detail.viewSoilData'))}
            variant="outline"
          />
          <ActionButton
            icon="calendar-clock"
            label={t('fields.detail.irrigationSchedule')}
            onPress={() => handleAction(t('fields.detail.irrigationSchedule'))}
            variant="outline"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  backBtn: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  overviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xxl,
    ...SHADOWS.md,
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  overviewInfo: {
    flex: 1,
  },
  overviewName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  overviewArea: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  overviewStatusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  overviewStatusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  overviewCropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  overviewCropName: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primaryLight,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  growthProgressCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    ...SHADOWS.sm,
  },
  growthProgressBarContainer: {
    height: 10,
    backgroundColor: COLORS.divider,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  growthProgressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  growthProgressText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    textAlign: 'right',
    marginBottom: SPACING.lg,
  },
  stageLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stageLabelItem: {
    alignItems: 'center',
    flex: 1,
  },
  stageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: SPACING.xs,
  },
  stageLabelText: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  infoGridItem: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  infoGridIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  infoGridLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginBottom: 2,
  },
  infoGridValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  cropDetailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    ...SHADOWS.sm,
  },
  cropDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropDetailsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  cropDetailsInfo: {
    flex: 1,
  },
  cropDetailsName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  cropDetailsStage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cropDetailsDays: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
    marginTop: 2,
  },
  locationCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    ...SHADOWS.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  locationValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  actionsSection: {
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
  },
  actionButtonOutline: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  actionButtonTextPrimary: {
    color: COLORS.white,
  },
  actionButtonTextOutline: {
    color: COLORS.primary,
  },
});

export default FieldDetailScreen;
