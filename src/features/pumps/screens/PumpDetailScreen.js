import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { togglePump, stopAllPumps } from '../slice/pumpsSlice';

const DETAIL_MODES = [
  { id: 'timer', label: 'Timer', icon: 'timer-outline' },
  { id: 'schedule', label: 'Schedule', icon: 'calendar-clock' },
  { id: 'sensor', label: 'Sensor', icon: 'access-point' },
  { id: 'ai', label: 'AI Mode', icon: 'robot' },
];

const TIMER_PRESETS = ['00:15:00', '00:15:00', '00:30:00'];

const PumpDetailScreen = ({ navigation, route }) => {
  const { pumpId } = route.params;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const pump = useSelector((state) =>
    state.pumps.pumps.find((p) => p.id === pumpId),
  ) || { id: pumpId, name: `Pump ${pumpId}`, field: 'No field assigned', status: 'off' };

  const [selectedMode, setSelectedMode] = useState('timer');
  const [soilMoistureEnabled, setSoilMoistureEnabled] = useState(false);
  const [waterLevelEnabled, setWaterLevelEnabled] = useState(false);

  const handleEmergencyStop = () => {
    dispatch(togglePump(pumpId));
  };

  const renderModeContent = () => {
    switch (selectedMode) {
      case 'timer':
        return (
          <View style={styles.modeContent}>
            <Text style={styles.sectionTitle}>Active Timers</Text>
            <View style={styles.presetRow}>
              {TIMER_PRESETS.map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.presetChip}
                  onPress={() => navigation.navigate('PumpTimer', { pumpId })}
                >
                  <Text style={styles.presetChipText}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.timerDisplayContainer}>
              <Text style={styles.timerDisplayLabel}>Timer</Text>
              <Text style={styles.timerDisplayLarge}>99:59:59</Text>
              <View style={styles.timerDivider} />
              <Text style={styles.timerDisplaySmall}>00:00:00</Text>
            </View>

            <TouchableOpacity
              style={styles.startTimerButton}
              onPress={() => navigation.navigate('PumpTimer', { pumpId })}
            >
              <MaterialCommunityIcons name="timer-outline" size={20} color={COLORS.white} />
              <Text style={styles.startTimerText}>Start / Set New Timer</Text>
            </TouchableOpacity>
          </View>
        );

      case 'schedule':
        return (
          <View style={styles.modeContent}>
            <View style={styles.placeholderContainer}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={48}
                color={COLORS.textSecondary}
              />
              <Text style={styles.placeholderText}>
                Irrigation schedules will appear here
              </Text>
            </View>
          </View>
        );

      case 'sensor':
        return (
          <View style={styles.modeContent}>
            <Text style={styles.sectionTitle}>Sensor Controls</Text>

            <View style={styles.sensorCard}>
              <View style={styles.sensorCardHeader}>
                <View style={styles.sensorIconContainer}>
                  <MaterialCommunityIcons
                    name="water-percent"
                    size={24}
                    color={COLORS.primaryLight}
                  />
                </View>
                <View style={styles.sensorInfo}>
                  <Text style={styles.sensorTitle}>Soil Moisture Control</Text>
                  <Text style={styles.sensorSubtitle}>
                    Start at 30% / Stop at 60%
                  </Text>
                </View>
                <Switch
                  value={soilMoistureEnabled}
                  onValueChange={setSoilMoistureEnabled}
                  trackColor={{ false: COLORS.background, true: COLORS.primaryLight }}
                  thumbColor={COLORS.white}
                />
              </View>
            </View>

            <View style={styles.sensorCard}>
              <View style={styles.sensorCardHeader}>
                <View style={styles.sensorIconContainer}>
                  <MaterialCommunityIcons
                    name="water"
                    size={24}
                    color={COLORS.info}
                  />
                </View>
                <View style={styles.sensorInfo}>
                  <Text style={styles.sensorTitle}>Water Level Control</Text>
                  <Text style={styles.sensorSubtitle}>
                    Water Level at 65%
                  </Text>
                </View>
                <Switch
                  value={waterLevelEnabled}
                  onValueChange={setWaterLevelEnabled}
                  trackColor={{ false: COLORS.background, true: COLORS.primaryLight }}
                  thumbColor={COLORS.white}
                />
              </View>
            </View>
          </View>
        );

      case 'ai':
        return (
          <View style={styles.modeContent}>
            <View style={styles.placeholderContainer}>
              <MaterialCommunityIcons
                name="robot"
                size={56}
                color={COLORS.primaryLight}
              />
              <Text style={styles.aiTitle}>AI Mode</Text>
              <Text style={styles.placeholderText}>
                AI mode will analyze your crop needs and automatically optimize
                irrigation for maximum yield and water efficiency.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pump.name}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditPump', { pumpId })}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={18}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pump Status */}
        <View style={styles.statusRow}>
          <View style={styles.pumpIconContainer}>
            <MaterialCommunityIcons
              name="water-pump"
              size={32}
              color={pump.status === 'on' ? COLORS.primaryLight : COLORS.textSecondary}
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.pumpName}>{pump.name}</Text>
            <Text style={styles.pumpField}>{pump.field || 'No field assigned'}</Text>
            <View style={[styles.statusBadge, pump.status === 'on' && styles.statusBadgeOn]}>
              <Text style={[styles.statusText, pump.status === 'on' && styles.statusTextOn]}>
                {pump.status === 'on' ? 'Running' : 'Idle'}
              </Text>
            </View>
          </View>
        </View>

        {/* Mode Selection */}
        <Text style={styles.modeSectionTitle}>Select Mode of Operation</Text>
        <View style={styles.modeRow}>
          {DETAIL_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[styles.modeButton, selectedMode === mode.id && styles.modeButtonActive]}
              onPress={() => setSelectedMode(mode.id)}
            >
              <View
                style={[
                  styles.modeIconContainer,
                  selectedMode === mode.id && styles.modeIconActive,
                ]}
              >
                <MaterialCommunityIcons
                  name={mode.icon}
                  size={20}
                  color={selectedMode === mode.id ? COLORS.white : COLORS.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.modeLabel,
                  selectedMode === mode.id && styles.modeLabelActive,
                ]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dynamic Mode Content */}
        {renderModeContent()}
      </ScrollView>

      {/* Emergency Stop */}
      <TouchableOpacity
        style={[styles.emergencyButton, { marginBottom: insets.bottom + 8 }]}
        onPress={handleEmergencyStop}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="stop-circle" size={20} color={COLORS.white} />
        <Text style={styles.emergencyText}>Emergency Stop this Pump</Text>
      </TouchableOpacity>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  pumpIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  statusInfo: {
    flex: 1,
  },
  pumpName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  pumpField: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
  },
  statusBadgeOn: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  statusTextOn: {
    color: COLORS.primaryLight,
  },
  modeSectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xxl,
  },
  modeButton: {
    alignItems: 'center',
    width: 64,
  },
  modeButtonActive: {},
  modeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
  modeContent: {
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  presetRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  presetChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  presetChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primaryLight,
  },
  timerDisplayContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  timerDisplayLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  timerDisplayLarge: {
    fontSize: FONT_SIZES.hero,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  timerDivider: {
    width: 60,
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  timerDisplaySmall: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
  startTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  startTimerText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxxl,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
  },
  placeholderText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 22,
  },
  aiTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryLight,
    marginTop: SPACING.md,
  },
  sensorCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sensorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  sensorSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emergencyButton: {
    position: 'absolute',
    bottom: 0,
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

export default PumpDetailScreen;
