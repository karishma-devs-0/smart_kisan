import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS, TAB_BAR } from '../../../constants/layout';
import { fetchPumps, setMode, togglePump, stopAllPumps, setSelectedPump } from '../slice/pumpsSlice';
import ScreenLayout from '../../../components/common/ScreenLayout';

const MODES = [
  { id: 'manual', label: 'Manual', icon: 'hand-back-right' },
  { id: 'automatic', label: 'Automatic', icon: 'auto-fix' },
  { id: 'timer', label: 'Timer', icon: 'timer-outline' },
  { id: 'schedule', label: 'Schedule', icon: 'calendar-clock' },
  { id: 'sensor', label: 'Sensor', icon: 'access-point' },
  { id: 'ai', label: 'AI Mode', icon: 'robot' },
];

const ModeButton = ({ mode, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.modeButton, isActive && styles.modeButtonActive]}
    onPress={() => onPress(mode.id)}
  >
    <View style={[styles.modeIconContainer, isActive && styles.modeIconActive]}>
      <MaterialCommunityIcons
        name={mode.icon}
        size={22}
        color={isActive ? COLORS.white : COLORS.textSecondary}
      />
    </View>
    <Text style={[styles.modeLabel, isActive && styles.modeLabelActive]}>
      {mode.label}
    </Text>
  </TouchableOpacity>
);

const PumpListItem = React.memo(({ pump, onToggle, onPress, currentMode }) => (
  <TouchableOpacity
    style={styles.pumpCard}
    onPress={() => onPress(pump.id)}
    activeOpacity={0.7}
  >
    <View style={styles.pumpIconContainer}>
      <MaterialCommunityIcons
        name="water-pump"
        size={28}
        color={pump.status === 'on' ? COLORS.primaryLight : COLORS.textSecondary}
      />
    </View>
    <View style={styles.pumpInfo}>
      <Text style={styles.pumpName}>{pump.name}</Text>
      <Text style={styles.pumpField}>{pump.field || 'No field assigned'}</Text>
      {currentMode !== 'manual' && (
        <View style={styles.modeTag}>
          <Text style={styles.modeTagText}>
            {pump.status === 'on' ? `Set to run for 30 min` : 'Idle'}
          </Text>
        </View>
      )}
    </View>
    <TouchableOpacity
      style={[styles.toggleTrack, pump.status === 'on' && styles.toggleTrackOn]}
      onPress={() => onToggle(pump.id)}
    >
      <View style={[styles.toggleThumb, pump.status === 'on' && styles.toggleThumbOn]} />
    </TouchableOpacity>
  </TouchableOpacity>
));

const MyPumpsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { pumps, currentMode, loading } = useSelector((state) => state.pumps);

  useEffect(() => {
    dispatch(fetchPumps());
  }, [dispatch]);

  const handleModeChange = (modeId) => {
    dispatch(setMode(modeId));
  };

  const handleTogglePump = (pumpId) => {
    dispatch(togglePump(pumpId));
  };

  const handlePumpPress = (pumpId) => {
    dispatch(setSelectedPump(pumpId));
    navigation.navigate('PumpDetail', { pumpId });
  };

  const handleEmergencyStop = () => {
    dispatch(stopAllPumps());
  };

  const renderHeader = () => (
    <View>
      {/* Mode Selection */}
      <Text style={styles.modeSectionTitle}>Mode Selection</Text>
      <View style={styles.modeRow}>
        {MODES.map((mode) => (
          <ModeButton
            key={mode.id}
            mode={mode}
            isActive={currentMode === mode.id}
            onPress={handleModeChange}
          />
        ))}
      </View>

      {/* Section label */}
      <Text style={styles.sectionLabel}>Individual Pump</Text>
    </View>
  );

  return (
    <ScreenLayout
      prefix="My,"
      title="Pumps"
      rightActions={[
        { icon: 'pencil', onPress: () => navigation.navigate('EditPumpGroups') },
        { icon: 'view-grid-outline', onPress: () => navigation.navigate('PumpGroups') },
      ]}
      scrollable={false}
      renderBottomOverlay={({ tabBarBottomPadding }) => (
        <TouchableOpacity
          style={[styles.emergencyButton, { bottom: tabBarBottomPadding + 8 }]}
          onPress={handleEmergencyStop}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="stop-circle" size={20} color={COLORS.white} />
          <Text style={styles.emergencyText}>Emergency Stop all Pumps</Text>
        </TouchableOpacity>
      )}
    >
      <FlatList
        data={pumps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PumpListItem
            pump={item}
            onToggle={handleTogglePump}
            onPress={handlePumpPress}
            currentMode={currentMode}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 140,
  },
  modeSectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxl,
  },
  modeButton: {
    alignItems: 'center',
    width: 56,
  },
  modeButtonActive: {},
  modeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modeIconActive: {
    backgroundColor: COLORS.primary,
  },
  modeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modeLabelActive: {
    color: COLORS.primaryLight,
    fontWeight: FONT_WEIGHTS.medium,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  pumpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  pumpIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  pumpInfo: {
    flex: 1,
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
  modeTag: {
    marginTop: 4,
  },
  modeTagText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primaryLight,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleTrackOn: {
    backgroundColor: COLORS.primaryLight,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.white,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.white,
  },
  emergencyButton: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.lg,
  },
  emergencyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
});

export default MyPumpsScreen;
