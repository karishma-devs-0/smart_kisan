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

const MOCK_FARM_STATS = {
  totalArea: 57.3,
  activeCrops: 4,
  irrigationZones: 6,
  devices: 12,
};

const MOCK_GROWTH_TREND = [
  { day: 'Mon', index: 0.65 },
  { day: 'Tue', index: 0.68 },
  { day: 'Wed', index: 0.72 },
  { day: 'Thu', index: 0.70 },
  { day: 'Fri', index: 0.75 },
  { day: 'Sat', index: 0.78 },
  { day: 'Sun', index: 0.74 },
];

const MOCK_ALERTS = [
  {
    id: '1',
    severity: 'warning',
    message: 'Soil moisture in Field D dropping below threshold',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    severity: 'info',
    message: 'Weather station firmware update available',
    timestamp: '5 hours ago',
  },
  {
    id: '3',
    severity: 'warning',
    message: 'Pump 3 runtime exceeded daily limit',
    timestamp: '8 hours ago',
  },
  {
    id: '4',
    severity: 'info',
    message: 'New satellite imagery available for your farm',
    timestamp: '1 day ago',
  },
];

const getNdviHealthColor = (health) => {
  if (health === 'excellent') return '#1B5E20';
  if (health === 'good') return '#4CAF50';
  if (health === 'moderate') return '#FF9800';
  return '#F44336';
};

const StatCard = ({ icon, value, unit, label, color }) => (
  <View style={styles.statCard}>
    <MaterialCommunityIcons name={icon} size={24} color={color} />
    <View style={styles.statValueRow}>
      <Text style={styles.statValue}>{value}</Text>
      {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
    </View>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const VegetationCard = ({ zone }) => {
  const color = getNdviHealthColor(zone.health);
  return (
    <View style={styles.vegCard}>
      <View style={[styles.vegColorStrip, { backgroundColor: color }]} />
      <View style={styles.vegContent}>
        <Text style={styles.vegName} numberOfLines={1}>{zone.name}</Text>
        <View style={styles.vegDetailsRow}>
          <View style={[styles.vegHealthBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.vegHealthText, { color }]}>
              {zone.health.charAt(0).toUpperCase() + zone.health.slice(1)}
            </Text>
          </View>
          <Text style={styles.vegArea}>{zone.area} acres</Text>
        </View>
      </View>
      <Text style={[styles.vegNdvi, { color }]}>{zone.ndviValue.toFixed(2)}</Text>
    </View>
  );
};

const AlertCard = ({ alert }) => {
  const isWarning = alert.severity === 'warning';
  return (
    <View style={styles.alertCard}>
      <MaterialCommunityIcons
        name={isWarning ? 'alert-circle' : 'information'}
        size={20}
        color={isWarning ? COLORS.warning : COLORS.info}
      />
      <View style={styles.alertContent}>
        <Text style={styles.alertMessage}>{alert.message}</Text>
        <Text style={styles.alertTimestamp}>{alert.timestamp}</Text>
      </View>
    </View>
  );
};

const FarmOverviewScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { ndviData, loading } = useSelector((state) => state.analytics);

  useEffect(() => {
    if (!ndviData) {
      dispatch(fetchAnalytics());
    }
  }, [dispatch, ndviData]);

  const zones = ndviData ? ndviData.zones : [];
  const maxGrowth = Math.max(...MOCK_GROWTH_TREND.map((d) => d.index));

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
        <Text style={styles.titleText}> Overview</Text>
      </View>

      {/* Farm Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="map-marker-radius"
          value={MOCK_FARM_STATS.totalArea}
          unit="acres"
          label="Total Area"
          color={COLORS.primary}
        />
        <StatCard
          icon="sprout"
          value={MOCK_FARM_STATS.activeCrops}
          label="Active Crops"
          color={COLORS.success}
        />
        <StatCard
          icon="water"
          value={MOCK_FARM_STATS.irrigationZones}
          label="Irrigation Zones"
          color={COLORS.info}
        />
        <StatCard
          icon="devices"
          value={MOCK_FARM_STATS.devices}
          label="Devices"
          color={COLORS.warning}
        />
      </View>

      {/* Vegetation Health */}
      <Text style={styles.sectionTitle}>Vegetation Health</Text>
      {zones.map((zone) => (
        <VegetationCard key={zone.id} zone={zone} />
      ))}

      {/* Growth Trend */}
      <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Growth Trend (Last 7 Days)</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartArea}>
          {MOCK_GROWTH_TREND.map((day, index) => (
            <View key={index} style={styles.chartBarColumn}>
              <View
                style={[
                  styles.chartBar,
                  {
                    height: `${(day.index / maxGrowth) * 100}%`,
                    backgroundColor: day.index > 0.7 ? COLORS.primary : COLORS.primary + '60',
                  },
                ]}
              />
              <Text style={styles.chartBarLabel}>{day.day}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chartLegendRow}>
          <Text style={styles.chartLegendText}>Growth Index Range: 0.65 - 0.78</Text>
        </View>
      </View>

      {/* Alerts */}
      <Text style={styles.sectionTitle}>Farm Alerts</Text>
      {MOCK_ALERTS.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}

      {/* View Full Analytics Button */}
      <TouchableOpacity
        style={styles.fullAnalyticsBtn}
        onPress={() => navigation.navigate('FarmAnalytics')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="chart-box" size={20} color={COLORS.white} />
        <Text style={styles.fullAnalyticsBtnText}>View Full Analytics</Text>
      </TouchableOpacity>
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

  // Stats Grid (2x2)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  statValue: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  statUnit: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  statLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  // Vegetation Cards
  vegCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  vegColorStrip: { width: 4, alignSelf: 'stretch' },
  vegContent: { flex: 1, padding: SPACING.lg },
  vegName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  vegDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  vegHealthBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  vegHealthText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.medium },
  vegArea: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  vegNdvi: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, paddingRight: SPACING.lg },

  // Growth Trend Chart
  chartCard: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl },
  chartArea: { height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  chartBarColumn: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  chartBar: { width: 28, borderRadius: 4, minHeight: 8 },
  chartBarLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: SPACING.xs },
  chartLegendRow: { alignItems: 'center', marginTop: SPACING.md },
  chartLegendText: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },

  // Alert Cards
  alertCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  alertContent: { flex: 1 },
  alertMessage: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  alertTimestamp: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },

  // Full Analytics Button
  fullAnalyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  fullAnalyticsBtnText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
});

export default FarmOverviewScreen;
