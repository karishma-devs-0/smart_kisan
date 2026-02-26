import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';
import FarmMapWidget from '../../../components/farm/FarmMapWidget';
import { fetchFields } from '../../fields/slice/fieldsSlice';
import { fetchDevices } from '../../devices/slice/devicesSlice';

const QuickStatCard = ({ icon, label, value, color, onPress }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const QuickActionButton = ({ icon, label, onPress, color = COLORS.primary }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={[styles.actionIconContainer, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const ActivityItem = ({ icon, message, time, color }) => (
  <View style={styles.activityItem}>
    <View style={[styles.activityDot, { backgroundColor: color }]} />
    <View style={styles.activityContent}>
      <Text style={styles.activityMessage}>{message}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  </View>
);

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const fields = useSelector((state) => state.fields.fields);
  const devices = useSelector((state) => state.devices.devices);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    dispatch(fetchFields());
    dispatch(fetchDevices());
  }, [dispatch]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderCustomHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.userName}>{user?.name || 'Farmer'}</Text>
      </View>
      <TouchableOpacity style={styles.notificationButton}>
        <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.white} />
        <View style={styles.notificationBadge} />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenLayout
      renderCustomHeader={renderCustomHeader}
      scrollable={true}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      {/* Power & Pump Status Banner */}
      <View style={styles.statusBanner}>
        <View style={styles.statusItem}>
          <MaterialCommunityIcons name="lightning-bolt" size={20} color={COLORS.success} />
          <Text style={styles.statusText}>Power: </Text>
          <Text style={[styles.statusValue, { color: COLORS.success }]}>Available</Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusItem}>
          <MaterialCommunityIcons name="water-pump" size={20} color={COLORS.info} />
          <Text style={styles.statusText}>Pump: </Text>
          <Text style={[styles.statusValue, { color: COLORS.info }]}>2 Active</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsRow}>
        <QuickStatCard icon="water-pump" label="Active Pumps" value="2/6" color={COLORS.primary} />
        <QuickStatCard icon="water-percent" label="Soil Moisture" value="45%" color={COLORS.info} />
        <QuickStatCard icon="thermometer" label="Temperature" value="32°C" color={COLORS.warning} />
      </View>

      {/* Farm Map Widget */}
      <FarmMapWidget
        fields={fields}
        devices={devices}
        onPress={() => navigation.navigate('FarmMap')}
      />

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <QuickActionButton icon="water-pump" label="My Pumps" onPress={() => navigation.navigate('PumpsTab')} />
        <QuickActionButton icon="leaf" label="My Soil" onPress={() => navigation.navigate('SoilTab')} color="#8BC34A" />
        <QuickActionButton icon="sprout" label="My Crops" onPress={() => navigation.navigate('MyCrops')} color="#FF9800" />
        <QuickActionButton icon="weather-partly-cloudy" label="Weather" onPress={() => navigation.navigate('WeatherTab')} color="#2196F3" />
        <QuickActionButton icon="chart-line" label="Reports" onPress={() => navigation.navigate('ComprehensiveReport')} color="#9C27B0" />
        <QuickActionButton icon="access-point" label="Devices" onPress={() => navigation.navigate('DeviceList')} color="#607D8B" />
        <QuickActionButton icon="brain" label="Analytics" onPress={() => navigation.navigate('FarmAnalytics')} color="#E91E63" />
        <QuickActionButton icon="tractor" label="Farm" onPress={() => navigation.navigate('FarmManagement')} color="#795548" />
        <QuickActionButton icon="vector-square" label="My Fields" onPress={() => navigation.navigate('MyFields')} color="#009688" />
        <QuickActionButton icon="leaf" label="Disease" onPress={() => navigation.navigate('PlantDisease')} color={COLORS.danger} />
      </View>

      {/* Today's Run Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ComprehensiveReport')}>
            <Text style={styles.viewAllText}>View Reports</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>4.5 hrs</Text>
            <Text style={styles.summaryLabel}>Run Hours</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>2,450 L</Text>
            <Text style={styles.summaryLabel}>Water Used</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>12 kWh</Text>
            <Text style={styles.summaryLabel}>Power Used</Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityCard}>
        <ActivityItem icon="water-pump" message="Pump 1 turned on - Field A" time="2 hours ago" color={COLORS.success} />
        <ActivityItem icon="alert" message="Soil moisture dropped to 42%" time="3 hours ago" color={COLORS.warning} />
        <ActivityItem icon="water-pump" message="Pump 3 completed timer (30 min)" time="5 hours ago" color={COLORS.info} />
        <ActivityItem icon="weather-rainy" message="Rain expected tomorrow - 70% chance" time="6 hours ago" color={COLORS.info} />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    opacity: 0.85,
  },
  userName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  statusBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  statusItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginLeft: 4 },
  statusValue: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold },
  statusDivider: { width: 1, height: 24, backgroundColor: COLORS.divider },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xxl },
  statCard: { flex: 1, backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  statIconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  statValue: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.lg, marginBottom: SPACING.xxl },
  actionButton: { width: '28%', alignItems: 'center' },
  actionIconContainer: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  actionLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium, textAlign: 'center' },
  summaryCard: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xxl },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  summaryTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  viewAllText: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: FONT_WEIGHTS.medium },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  summaryLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: COLORS.divider },
  activityCard: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  activityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: SPACING.md },
  activityContent: { flex: 1 },
  activityMessage: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  activityTime: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 2 },
});

export default HomeScreen;
