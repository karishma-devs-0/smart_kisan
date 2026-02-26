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

const getHealthColor = (index) => {
  if (index > 70) return COLORS.success;
  if (index > 40) return COLORS.warning;
  return COLORS.danger;
};

const getStatusLabel = (status) => {
  if (status === 'healthy') return 'Healthy';
  if (status === 'warning') return 'Warning';
  return 'Critical';
};

const formatTimestamp = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getInsightTypeIcon = (type) => {
  if (type === 'recommendation') return 'lightbulb-on';
  if (type === 'warning') return 'alert-circle';
  return 'information';
};

const CropHealthRing = ({ score }) => {
  const color = getHealthColor(score);
  return (
    <View style={[styles.healthRing, { borderColor: color }]}>
      <Text style={[styles.healthScore, { color }]}>{score}%</Text>
      <Text style={styles.healthScoreLabel}>Overall</Text>
    </View>
  );
};

const FieldHealthCard = ({ field }) => {
  const color = getHealthColor(field.healthIndex);
  return (
    <View style={styles.fieldCard}>
      <View style={styles.fieldCardHeader}>
        <Text style={styles.fieldName}>{field.fieldName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.statusBadgeText, { color }]}>{getStatusLabel(field.status)}</Text>
        </View>
      </View>
      <Text style={styles.fieldCropType}>{field.cropType}</Text>
      <View style={styles.healthBarContainer}>
        <View style={[styles.healthBarFill, { width: `${field.healthIndex}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.healthBarValue, { color }]}>{field.healthIndex}%</Text>
      {field.issues.length > 0 && (
        <View style={styles.issuesList}>
          {field.issues.map((issue, index) => (
            <View key={index} style={styles.issueRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color={COLORS.warning} />
              <Text style={styles.issueText}>{issue}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const InsightCard = ({ insight }) => (
  <View style={styles.insightCard}>
    <View style={[styles.insightIconContainer, { backgroundColor: insight.color + '15' }]}>
      <MaterialCommunityIcons name={insight.icon} size={24} color={insight.color} />
    </View>
    <View style={styles.insightContent}>
      <View style={styles.insightHeader}>
        <View style={[styles.insightTypeBadge, { backgroundColor: insight.color + '15' }]}>
          <MaterialCommunityIcons name={getInsightTypeIcon(insight.type)} size={12} color={insight.color} />
          <Text style={[styles.insightTypeText, { color: insight.color }]}>
            {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
          </Text>
        </View>
        <Text style={styles.insightTimestamp}>{formatTimestamp(insight.timestamp)}</Text>
      </View>
      <Text style={styles.insightTitle}>{insight.title}</Text>
      <Text style={styles.insightDescription} numberOfLines={2}>{insight.description}</Text>
      <View style={styles.confidenceRow}>
        <Text style={styles.confidenceLabel}>Confidence</Text>
        <View style={styles.confidenceBarContainer}>
          <View style={[styles.confidenceBarFill, { width: `${insight.confidence}%` }]} />
        </View>
        <Text style={styles.confidenceValue}>{insight.confidence}%</Text>
      </View>
    </View>
  </View>
);

const QuickActionButton = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.quickActionIcon}>
      <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const FarmAnalyticsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { cropHealth, aiInsights, loading } = useSelector((state) => state.analytics);

  useEffect(() => {
    dispatch(fetchAnalytics());
  }, [dispatch]);

  const healthData = cropHealth || { overall: 82, fields: [] };
  const insights = aiInsights || [];

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
        <Text style={styles.titlePrefix}>Farm</Text>
        <Text style={styles.titleText}> Analytics</Text>
      </View>

      {/* Crop Health Index */}
      <View style={styles.healthCard}>
        <Text style={styles.sectionTitle}>Crop Health Index</Text>
        <View style={styles.healthOverview}>
          <CropHealthRing score={healthData.overall} />
          <View style={styles.healthSummary}>
            <Text style={styles.healthSummaryTitle}>Farm Health Status</Text>
            <Text style={styles.healthSummaryText}>
              {healthData.overall > 70 ? 'Your farm is in good condition' : 'Some fields need attention'}
            </Text>
            <View style={styles.healthStatsRow}>
              <View style={styles.healthStat}>
                <View style={[styles.healthStatDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.healthStatText}>
                  {healthData.fields.filter((f) => f.status === 'healthy').length} Healthy
                </Text>
              </View>
              <View style={styles.healthStat}>
                <View style={[styles.healthStatDot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.healthStatText}>
                  {healthData.fields.filter((f) => f.status === 'warning').length} Warning
                </Text>
              </View>
              <View style={styles.healthStat}>
                <View style={[styles.healthStatDot, { backgroundColor: COLORS.danger }]} />
                <Text style={styles.healthStatText}>
                  {healthData.fields.filter((f) => f.status === 'critical').length} Critical
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Field Health Breakdown */}
      <Text style={styles.sectionTitle}>Field Health Breakdown</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fieldScrollView}>
        {healthData.fields.map((field, index) => (
          <FieldHealthCard key={index} field={field} />
        ))}
      </ScrollView>

      {/* AI Insights */}
      <View style={styles.sectionHeaderRow}>
        <MaterialCommunityIcons name="brain" size={22} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>AI Insights</Text>
      </View>
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsRow}>
        <QuickActionButton
          icon="satellite-variant"
          label="NDVI Map"
          onPress={() => navigation.navigate('NDVIMap')}
        />
        <QuickActionButton
          icon="chart-line"
          label="Yield Forecast"
          onPress={() => navigation.navigate('YieldPrediction')}
        />
        <QuickActionButton
          icon="calendar-clock"
          label="Schedule"
          onPress={() => navigation.navigate('YieldPrediction')}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  contentContainer: { padding: SPACING.lg, paddingBottom: SPACING.xxxxl },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  titlePrefix: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  titleText: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md, marginTop: SPACING.md },

  // Crop Health Card
  healthCard: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, marginBottom: SPACING.xl },
  healthOverview: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xl },
  healthRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthScore: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold },
  healthScoreLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  healthSummary: { flex: 1 },
  healthSummaryTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  healthSummaryText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  healthStatsRow: { flexDirection: 'row', gap: SPACING.md },
  healthStat: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  healthStatDot: { width: 8, height: 8, borderRadius: 4 },
  healthStatText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },

  // Field Health Cards (horizontal scroll)
  fieldScrollView: { marginBottom: SPACING.xl },
  fieldCard: {
    width: 220,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginRight: SPACING.md,
  },
  fieldCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  fieldName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, flex: 1 },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  statusBadgeText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.medium },
  fieldCropType: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  healthBarContainer: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden', marginBottom: SPACING.xs },
  healthBarFill: { height: '100%', borderRadius: 3 },
  healthBarValue: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, marginBottom: SPACING.sm },
  issuesList: { marginTop: SPACING.xs, gap: SPACING.xs },
  issueRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  issueText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, flex: 1 },

  // AI Insight Cards
  insightCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  insightIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: { flex: 1 },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  insightTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  insightTypeText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.medium },
  insightTimestamp: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  insightTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  insightDescription: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 18, marginBottom: SPACING.sm },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  confidenceLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  confidenceBarContainer: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  confidenceBarFill: { height: '100%', borderRadius: 2, backgroundColor: COLORS.primary },
  confidenceValue: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.primary },

  // Quick Actions
  quickActionsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.primarySurface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.primary, textAlign: 'center' },
});

export default FarmAnalyticsScreen;
