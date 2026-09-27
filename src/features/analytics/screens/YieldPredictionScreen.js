import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { fetchAnalytics } from '../slice/analyticsSlice';
import { fetchYieldSummary } from '../../harvests/slice/harvestsSlice';
import { useTranslation } from 'react-i18next';

const getPriorityColor = (priority) => {
  if (priority === 'high') return COLORS.danger;
  if (priority === 'medium') return COLORS.warning;
  return COLORS.success;
};

const getPriorityLabel = (priority) => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

const formatScheduleDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const getNextIrrigationCountdown = (schedules) => {
  if (!schedules || schedules.length === 0) return 'N/A';
  const now = new Date();
  const upcoming = schedules
    .map((s) => new Date(s.nextIrrigation))
    .filter((d) => d > now)
    .sort((a, b) => a - b);
  if (upcoming.length === 0) return 'N/A';
  const diffMs = upcoming[0] - now;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
  return `${diffMins}m`;
};

const CONFIDENCE_COLOURS = {
  good: COLORS.success,
  fair: COLORS.warning,
  low: COLORS.textTertiary,
};

/**
 * One crop's expected yield.
 *
 * This used to show a confidence percentage on a filled bar - 88%, 74% - with
 * no model behind it to be that confident about. The figure now comes from the
 * farmer's own past harvests, so the card says how many it is drawn from and
 * shows the arithmetic instead of a decorated number.
 */
const YieldCard = ({ crop, t }) => {
  const colour = CONFIDENCE_COLOURS[crop.confidence?.level] || COLORS.textTertiary;

  return (
    <View style={styles.yieldCard}>
      <View style={styles.yieldCardHeader}>
        <View style={styles.yieldCropInfo}>
          <MaterialCommunityIcons name="sprout" size={20} color={COLORS.primary} />
          <Text style={styles.yieldCropName}>{crop.cropName}</Text>
        </View>
        <View style={[styles.confidenceChip, { backgroundColor: colour + '22' }]}>
          <Text style={[styles.confidenceChipText, { color: colour }]}>
            {crop.basedOnHarvests} harvest{crop.basedOnHarvests === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <View style={styles.yieldValueRow}>
        <View>
          {crop.predictedQuintals != null ? (
            <>
              <Text style={styles.yieldValue}>{crop.predictedQuintals.toLocaleString()}</Text>
              <Text style={styles.yieldUnit}>
                {t('yield.quintalsExpected', 'quintals expected')}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.yieldValue}>{crop.yieldPerAcre}</Text>
              <Text style={styles.yieldUnit}>
                {t('yield.quintalsPerAcre', 'quintals an acre')}
              </Text>
            </>
          )}
        </View>

        {/* Shown only when past harvests actually varied. A single figure on a
            crop that has come in between 14 and 22 would read as more certain
            than it is. */}
        {crop.rangeQuintals && (
          <View style={styles.yieldLastYear}>
            <Text style={styles.yieldLastYearLabel}>
              {t('yield.range', 'Your range')}
            </Text>
            <Text style={styles.yieldLastYearValue}>
              {crop.rangeQuintals.low}–{crop.rangeQuintals.high} qtl
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.workedOut}>{crop.workedOut}</Text>

      <Text style={[styles.confidenceNote, { color: colour }]}>
        {crop.confidence?.label}
      </Text>

      {crop.needsArea && (
        <Text style={styles.needsArea}>
          {t('yield.needsArea',
            'Add the area of this crop and the app can give a total, not just '
            + 'a per-acre figure.')}
        </Text>
      )}
    </View>
  );
};

const ScheduleCard = ({ schedule }) => {
  const priorityColor = getPriorityColor(schedule.priority);
  return (
    <View style={styles.scheduleCard}>
      <View style={[styles.schedulePriorityStrip, { backgroundColor: priorityColor }]} />
      <View style={styles.scheduleContent}>
        <View style={styles.scheduleHeader}>
          <View style={styles.scheduleFieldInfo}>
            <Text style={styles.scheduleFieldName}>{schedule.fieldName}</Text>
            <Text style={styles.scheduleCropType}>{schedule.cropType}</Text>
          </View>
          <View style={styles.scheduleBadges}>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
              <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>{getPriorityLabel(schedule.priority)}</Text>
            </View>
            {schedule.aiRecommended && (
              <View style={styles.aiBadge}>
                <MaterialCommunityIcons name="brain" size={12} color={COLORS.primary} />
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.scheduleDetailsRow}>
          <View style={styles.scheduleDetailItem}>
            <MaterialCommunityIcons name="calendar-clock" size={16} color={COLORS.textTertiary} />
            <Text style={styles.scheduleDetailText}>{formatScheduleDate(schedule.nextIrrigation)}</Text>
          </View>
          <View style={styles.scheduleDetailItem}>
            <MaterialCommunityIcons name="timer-outline" size={16} color={COLORS.textTertiary} />
            <Text style={styles.scheduleDetailText}>{schedule.duration} min</Text>
          </View>
          <View style={styles.scheduleDetailItem}>
            <MaterialCommunityIcons name="water" size={16} color={COLORS.info} />
            <Text style={styles.scheduleDetailText}>{schedule.waterAmount.toLocaleString()} L</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const YieldPredictionScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { yieldPrediction, irrigationSchedule, loading } = useSelector((state) => state.analytics);

  useEffect(() => {
    // The prediction is drawn from past harvests, so those have to be loaded
    // before the analytics are worked out.
    dispatch(fetchYieldSummary());
  }, [dispatch]);

  useEffect(() => {
    if (!yieldPrediction) {
      dispatch(fetchAnalytics());
    }
  }, [dispatch, yieldPrediction]);

  const yields = yieldPrediction?.crops || [];
  const yieldNote = yieldPrediction?.note || null;
  const schedules = irrigationSchedule || [];

  const totalWater = schedules.reduce((sum, s) => sum + s.waterAmount, 0);
  const irrigationCount = schedules.length;
  const nextCountdown = getNextIrrigationCountdown(schedules);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titlePrefix}>{t('yield.prefix')}</Text>
        <Text style={styles.titleText}> {t('yield.title')}</Text>
      </View>

      {/* Yield Overview */}
      <Text style={styles.sectionTitle}>{t('yield.cropForecast')}</Text>
      {yields.map((crop, index) => (
        <YieldCard key={index} crop={crop} t={t} />
      ))}

      {/* Said plainly rather than left blank. Before harvests were recorded
          this screen showed invented figures; an empty screen with no
          explanation would just look broken instead. */}
      {yieldNote ? (
        <View style={styles.noteCard}>
          <MaterialCommunityIcons
            name="information-outline"
            size={18}
            color={COLORS.textSecondary}
          />
          <Text style={styles.noteText}>{yieldNote}</Text>
        </View>
      ) : null}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Irrigation Schedule */}
      <View style={styles.sectionHeaderRow}>
        <MaterialCommunityIcons name="brain" size={22} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>{t('yield.aiIrrigationSchedule')}</Text>
      </View>
      {schedules.map((schedule) => (
        <ScheduleCard key={schedule.id} schedule={schedule} />
      ))}

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{t('yield.irrigationSummary')}</Text>
        <View style={styles.summaryStatsRow}>
          <View style={styles.summaryStat}>
            <MaterialCommunityIcons name="water" size={24} color={COLORS.info} />
            <Text style={styles.summaryStatValue}>{(totalWater / 1000).toFixed(1)}K L</Text>
            <Text style={styles.summaryStatLabel}>{t('yield.totalWater')}</Text>
          </View>
          <View style={styles.summaryStatDivider} />
          <View style={styles.summaryStat}>
            <MaterialCommunityIcons name="format-list-numbered" size={24} color={COLORS.primary} />
            <Text style={styles.summaryStatValue}>{irrigationCount}</Text>
            <Text style={styles.summaryStatLabel}>{t('yield.irrigations')}</Text>
          </View>
          <View style={styles.summaryStatDivider} />
          <View style={styles.summaryStat}>
            <MaterialCommunityIcons name="clock-fast" size={24} color={COLORS.warning} />
            <Text style={styles.summaryStatValue}>{nextCountdown}</Text>
            <Text style={styles.summaryStatLabel}>{t('yield.nextIn')}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  confidenceChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  confidenceChipText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.medium },
  workedOut: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 16,
  },
  confidenceNote: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    marginTop: SPACING.xs,
  },
  needsArea: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
    lineHeight: 15,
  },
  noteCard: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: '#F5F5F5',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  noteText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  container: { flex: 1, backgroundColor: COLORS.white },
  contentContainer: { padding: SPACING.lg, paddingBottom: SPACING.xxxxl },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  titlePrefix: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  titleText: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.xl },

  // Yield Cards
  yieldCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  yieldCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  yieldCropInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  yieldCropName: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  yieldTrendRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  yieldChangePercent: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold },
  yieldValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: SPACING.md },
  yieldValue: { fontSize: FONT_SIZES.xxxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  yieldUnit: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 2 },
  yieldLastYear: { alignItems: 'flex-end' },
  yieldLastYearLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  yieldLastYearValue: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  confidenceLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  confidenceBarContainer: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  confidenceBarFill: { height: '100%', borderRadius: 2, backgroundColor: COLORS.primary },
  confidenceValue: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.primary },

  // Schedule Cards
  scheduleCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  schedulePriorityStrip: { width: 4 },
  scheduleContent: { flex: 1, padding: SPACING.lg },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  scheduleFieldInfo: { flex: 1 },
  scheduleFieldName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  scheduleCropType: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  scheduleBadges: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  priorityBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  priorityBadgeText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.medium },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primarySurface,
  },
  aiBadgeText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  scheduleDetailsRow: { flexDirection: 'row', gap: SPACING.lg },
  scheduleDetailItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  scheduleDetailText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginTop: SPACING.md,
  },
  summaryTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.primary, marginBottom: SPACING.lg, textAlign: 'center' },
  summaryStatsRow: { flexDirection: 'row', alignItems: 'center' },
  summaryStat: { flex: 1, alignItems: 'center', gap: SPACING.xs },
  summaryStatValue: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  summaryStatLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  summaryStatDivider: { width: 1, height: 40, backgroundColor: COLORS.primary + '30' },
});

export default YieldPredictionScreen;
