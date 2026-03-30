import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import {
  fetchPumps,
  setActiveTab,
  togglePump,
  controlPump,
  stopAllPumpsAsync,
  stopAllPumps,
  setSelectedPump,
  updatePumpStatusFromMQTT,
} from '../slice/pumpsSlice';
import { FIREBASE_ENABLED } from '../../../services/firebase';
import {
  onAllPumpStatus,
  sendPumpCommand,
  getConnectionStatus,
  onConnectionStatusChange,
} from '../../../services/mqtt';
import ScreenLayout from '../../../components/common/ScreenLayout';

// ─── Constants ──────────────────────────────────────────────────────────────────

const MODE_COLORS = {
  manual: '#607D8B',
  automatic: '#FF9800',
  timer: '#2196F3',
  schedule: '#9C27B0',
  sensor: '#00BCD4',
  ai: '#4CAF50',
};

const MODE_ICONS = {
  manual: 'hand-back-right',
  automatic: 'auto-fix',
  timer: 'timer-outline',
  schedule: 'calendar-clock',
  sensor: 'access-point',
  ai: 'robot',
};

const getTabs = (t) => [
  { id: 'all', label: t('pumps.tabs.all', 'All'), icon: 'view-list' },
  { id: 'manual', label: t('pumps.tabs.manual', 'Manual'), icon: MODE_ICONS.manual },
  { id: 'automatic', label: t('pumps.tabs.auto', 'Auto'), icon: MODE_ICONS.automatic },
  { id: 'timer', label: t('pumps.tabs.timer', 'Timer'), icon: MODE_ICONS.timer },
  { id: 'schedule', label: t('pumps.tabs.schedule', 'Schedule'), icon: MODE_ICONS.schedule },
  { id: 'sensor', label: t('pumps.tabs.sensor', 'Sensor'), icon: MODE_ICONS.sensor },
  { id: 'ai', label: t('pumps.tabs.ai', 'AI'), icon: MODE_ICONS.ai },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

const getRelativeTime = (isoDate) => {
  if (!isoDate) return 'Never';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const getModeLabel = (mode) => {
  const labels = {
    manual: 'Manual',
    automatic: 'Auto',
    timer: 'Timer',
    schedule: 'Schedule',
    sensor: 'Sensor',
    ai: 'AI',
  };
  return labels[mode] || mode;
};

// ─── Tab Item ───────────────────────────────────────────────────────────────────

const TabItem = React.memo(({ tab, isActive, count, onPress }) => (
  <TouchableOpacity
    style={[styles.tabItem, isActive && styles.tabItemActive]}
    onPress={() => onPress(tab.id)}
    activeOpacity={0.7}
  >
    <MaterialCommunityIcons
      name={tab.icon}
      size={16}
      color={isActive ? COLORS.white : COLORS.textSecondary}
    />
    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
      {tab.label}
    </Text>
    <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
      <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
        {count}
      </Text>
    </View>
  </TouchableOpacity>
));

// ─── Pump Card ──────────────────────────────────────────────────────────────────

const PumpCard = React.memo(({ pump, onToggle, onPress, t }) => {
  const isOn = pump.status === 'on';
  const modeColor = MODE_COLORS[pump.mode] || COLORS.textSecondary;
  const isManual = pump.mode === 'manual';

  return (
    <TouchableOpacity
      style={[styles.pumpCard, isOn && { borderLeftColor: COLORS.primaryLight, borderLeftWidth: 3 }]}
      onPress={() => onPress(pump.id)}
      activeOpacity={0.7}
    >
      {/* Left icon */}
      <View style={[styles.pumpIconCircle, { backgroundColor: modeColor + '18' }]}>
        <MaterialCommunityIcons
          name="water-pump"
          size={24}
          color={modeColor}
        />
      </View>

      {/* Center info */}
      <View style={styles.pumpInfo}>
        <Text style={styles.pumpName} numberOfLines={1}>{pump.name}</Text>
        <Text style={styles.pumpField} numberOfLines={1}>
          {pump.field || t('pumps.noFieldAssigned', 'No field assigned')}
        </Text>
        <Text style={styles.pumpLastRun}>
          {getRelativeTime(pump.lastRun)}
        </Text>
      </View>

      {/* Right section */}
      <View style={styles.pumpRight}>
        {/* Mode badge */}
        <View style={[styles.modeBadge, { backgroundColor: modeColor + '18' }]}>
          <Text style={[styles.modeBadgeText, { color: modeColor }]}>
            {getModeLabel(pump.mode)}
          </Text>
        </View>

        {/* Toggle or View button */}
        {isManual ? (
          <TouchableOpacity
            style={[styles.toggleTrack, isOn && styles.toggleTrackOn]}
            onPress={() => onToggle(pump.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleThumb, isOn && styles.toggleThumbOn]} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => onPress(pump.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewButtonText}>
              {t('pumps.view', 'View')} →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

// ─── Empty State ────────────────────────────────────────────────────────────────

const EmptyState = ({ activeTab, t }) => {
  const modeLabel = activeTab === 'all' ? '' : getModeLabel(activeTab);
  const icon = activeTab === 'all' ? 'water-pump-off' : (MODE_ICONS[activeTab] || 'water-pump-off');

  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name={icon} size={56} color={COLORS.textTertiary} />
      <Text style={styles.emptyTitle}>
        {activeTab === 'all'
          ? t('pumps.noPumps', 'No Pumps Yet')
          : t('pumps.noModePumps', { mode: modeLabel, defaultValue: `No ${modeLabel} pumps` })}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'all'
          ? t('pumps.addFirstPump', 'Add your first pump to start managing irrigation')
          : t('pumps.changeMode', "Add a pump or change a pump's mode")}
      </Text>
    </View>
  );
};

// ─── Main Screen ────────────────────────────────────────────────────────────────

const MyPumpsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { pumps, activeTab, loading } = useSelector((state) => state.pumps);
  const TABS = useMemo(() => getTabs(t), [t]);

  const [mqttStatus, setMqttStatus] = useState(getConnectionStatus());

  // Fetch pumps on mount
  useEffect(() => {
    dispatch(fetchPumps());
  }, [dispatch]);

  // Subscribe to MQTT pump status updates
  useEffect(() => {
    const unsubStatus = onConnectionStatusChange(setMqttStatus);
    const unsubPumps = onAllPumpStatus((pumpId, data) => {
      const status = typeof data === 'string' ? data : data?.status;
      if (status) {
        dispatch(updatePumpStatusFromMQTT({ pumpId, status }));
      }
    });
    return () => {
      unsubStatus();
      unsubPumps();
    };
  }, [dispatch]);

  // Count pumps per tab
  const tabCounts = useMemo(() => {
    const counts = { all: pumps.length };
    TABS.forEach((tab) => {
      if (tab.id !== 'all') {
        counts[tab.id] = pumps.filter((p) => p.mode === tab.id).length;
      }
    });
    return counts;
  }, [pumps, TABS]);

  // Filter pumps by active tab
  const filteredPumps = useMemo(() => {
    if (activeTab === 'all') return pumps;
    return pumps.filter((p) => p.mode === activeTab);
  }, [pumps, activeTab]);

  const handleTabPress = useCallback((tabId) => {
    dispatch(setActiveTab(tabId));
  }, [dispatch]);

  const handleTogglePump = useCallback((pumpId) => {
    const pump = pumps.find((p) => p.id === pumpId);
    const newAction = pump?.status === 'on' ? 'off' : 'on';

    // Send command via MQTT for real-time device control
    sendPumpCommand(pumpId, newAction);

    if (FIREBASE_ENABLED) {
      dispatch(controlPump({ pumpId, action: newAction }));
    } else {
      dispatch(togglePump(pumpId));
    }
  }, [pumps, dispatch]);

  const handlePumpPress = useCallback((pumpId) => {
    dispatch(setSelectedPump(pumpId));
    navigation.navigate('PumpDetail', { pumpId });
  }, [dispatch, navigation]);

  const handleEmergencyStop = useCallback(() => {
    // Send MQTT stop to all active pumps
    pumps.filter((p) => p.status === 'on').forEach((p) => {
      sendPumpCommand(p.id, 'off');
    });

    if (FIREBASE_ENABLED) {
      dispatch(stopAllPumpsAsync());
    } else {
      dispatch(stopAllPumps());
    }
  }, [pumps, dispatch]);

  // MQTT indicator color
  const mqttDotColor =
    mqttStatus === 'connected' ? '#4CAF50'
    : mqttStatus === 'connecting' ? '#FFC107'
    : '#F44336';

  const mqttLabel =
    mqttStatus === 'connected' ? t('pumps.mqttConnected', 'Live')
    : mqttStatus === 'connecting' ? t('pumps.mqttConnecting', 'Connecting...')
    : t('pumps.mqttDisconnected', 'Offline');

  // ─── Header (MQTT + Groups + Tabs) ─────────────────────────────────────────

  const renderHeader = () => (
    <View>
      {/* MQTT indicator + Groups button row */}
      <View style={styles.topRow}>
        <View style={styles.mqttIndicator}>
          <View style={[styles.mqttDot, { backgroundColor: mqttDotColor }]} />
          <Text style={styles.mqttLabel}>{mqttLabel}</Text>
        </View>

        <TouchableOpacity
          style={styles.groupsButton}
          onPress={() => navigation.navigate('PumpGroups')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="view-grid-outline" size={16} color={COLORS.primaryLight} />
          <Text style={styles.groupsButtonText}>{t('pumps.groups', 'Groups')}</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBarContent}
        style={styles.tabBar}
      >
        {TABS.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            count={tabCounts[tab.id] || 0}
            onPress={handleTabPress}
          />
        ))}
      </ScrollView>
    </View>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <ScreenLayout
      prefix={t('pumps.myPrefix', 'My_')}
      title={t('pumps.title', 'Pumps')}
      scrollable={false}
      renderBottomOverlay={({ tabBarBottomPadding }) => (
        <View style={{ position: 'absolute', right: SPACING.lg, bottom: tabBarBottomPadding + 8, alignItems: 'center', gap: SPACING.md }}>
          {/* FAB - Add pump */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('EditPump')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={28} color={COLORS.white} />
          </TouchableOpacity>

          {/* Emergency Stop */}
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleEmergencyStop}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="stop-circle" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    >
      <FlatList
        data={filteredPumps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PumpCard
            pump={item}
            onToggle={handleTogglePump}
            onPress={handlePumpPress}
            t={t}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading && <EmptyState activeTab={activeTab} t={t} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenLayout>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 160,
  },

  // Top row (MQTT + Groups)
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  mqttIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mqttDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  mqttLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  groupsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  groupsButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primaryLight,
  },

  // Tab bar
  tabBar: {
    marginBottom: SPACING.lg,
    marginHorizontal: -SPACING.lg,
  },
  tabBarContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: SPACING.xs,
  },
  tabItemActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryLight,
  },
  tabLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  tabLabelActive: {
    color: COLORS.white,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
  },
  tabBadgeTextActive: {
    color: COLORS.white,
  },

  // Pump card
  pumpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  pumpIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  pumpInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  pumpName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  pumpField: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pumpLastRun: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  // Right section of card
  pumpRight: {
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  modeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  modeBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
  },

  // Toggle switch (manual pumps)
  toggleTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleTrackOn: {
    backgroundColor: COLORS.primaryLight,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },

  // View button (non-manual pumps)
  viewButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  viewButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primaryLight,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.xxl,
  },

  // FAB
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    ...SHADOWS.lg,
  },

  // Emergency stop
  emergencyButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    ...SHADOWS.lg,
    shadowColor: COLORS.danger,
  },
});

export default MyPumpsScreen;
