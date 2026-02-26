import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';

const DETAIL_MODES = [
  { id: 'timer', label: 'Timer', icon: 'timer-outline' },
  { id: 'schedule', label: 'Schedule', icon: 'calendar-clock' },
  { id: 'sensor', label: 'Sensor', icon: 'access-point' },
  { id: 'ai', label: 'AI Mode', icon: 'robot' },
];

const TIMER_PRESETS = [
  { label: '00:15:00', hours: 0, minutes: 15, seconds: 0 },
  { label: '00:15:00', hours: 0, minutes: 15, seconds: 0 },
  { label: '00:30:00', hours: 0, minutes: 30, seconds: 0 },
];

const PumpTimerScreen = ({ navigation, route }) => {
  const { pumpId } = route.params;
  const insets = useSafeAreaInsets();

  const pump = useSelector((state) =>
    state.pumps.pumps.find((p) => p.id === pumpId),
  ) || { id: pumpId, name: `Pump ${pumpId}`, field: 'No field assigned' };

  const [selectedMode] = useState('timer');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const padTwo = (num) => String(num).padStart(2, '0');

  const incrementHours = () => setHours((prev) => (prev < 99 ? prev + 1 : 0));
  const decrementHours = () => setHours((prev) => (prev > 0 ? prev - 1 : 99));
  const incrementMinutes = () => setMinutes((prev) => (prev < 59 ? prev + 1 : 0));
  const decrementMinutes = () => setMinutes((prev) => (prev > 0 ? prev - 1 : 59));
  const incrementSeconds = () => setSeconds((prev) => (prev < 59 ? prev + 1 : 0));
  const decrementSeconds = () => setSeconds((prev) => (prev > 0 ? prev - 1 : 59));

  const handlePresetSelect = (preset) => {
    setHours(preset.hours);
    setMinutes(preset.minutes);
    setSeconds(preset.seconds);
  };

  const handleStart = () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds > 0) {
      navigation.navigate('TimerCountdown', {
        pumpId,
        totalSeconds,
        hours,
        minutes,
        seconds,
      });
    }
  };

  const formattedTime = `${padTwo(hours)}:${padTwo(minutes)}:${padTwo(seconds)}`;

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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitlePrefix}>My</Text>
          <Text style={styles.headerTitle}> Pumps</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pump Name */}
        <Text style={styles.pumpName}>{pump.name}</Text>

        {/* Mode Selection */}
        <Text style={styles.modeSectionTitle}>Select Mode of Operation</Text>
        <View style={styles.modeRow}>
          {DETAIL_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[styles.modeButton, selectedMode === mode.id && styles.modeButtonActive]}
              onPress={() => {}}
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

        {/* Large Timer Display */}
        <View style={styles.timerDisplayContainer}>
          <Text style={styles.timerDisplayText}>{formattedTime}</Text>
        </View>

        {/* Time Setter Columns */}
        <View style={styles.timeSetterContainer}>
          {/* Hours Column */}
          <View style={styles.timeColumn}>
            <Text style={styles.timeColumnLabel}>Hours</Text>
            <TouchableOpacity
              style={styles.chevronButton}
              onPress={incrementHours}
            >
              <MaterialCommunityIcons
                name="chevron-up"
                size={32}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
            <View style={styles.timeValueContainer}>
              <Text style={styles.timeValueText}>{padTwo(hours)}</Text>
            </View>
            <TouchableOpacity
              style={styles.chevronButton}
              onPress={decrementHours}
            >
              <MaterialCommunityIcons
                name="chevron-down"
                size={32}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.timeSeparator}>:</Text>

          {/* Minutes Column */}
          <View style={styles.timeColumn}>
            <Text style={styles.timeColumnLabel}>Minutes</Text>
            <TouchableOpacity
              style={styles.chevronButton}
              onPress={incrementMinutes}
            >
              <MaterialCommunityIcons
                name="chevron-up"
                size={32}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
            <View style={styles.timeValueContainer}>
              <Text style={styles.timeValueText}>{padTwo(minutes)}</Text>
            </View>
            <TouchableOpacity
              style={styles.chevronButton}
              onPress={decrementMinutes}
            >
              <MaterialCommunityIcons
                name="chevron-down"
                size={32}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.timeSeparator}>:</Text>

          {/* Seconds Column */}
          <View style={styles.timeColumn}>
            <Text style={styles.timeColumnLabel}>Seconds</Text>
            <TouchableOpacity
              style={styles.chevronButton}
              onPress={incrementSeconds}
            >
              <MaterialCommunityIcons
                name="chevron-up"
                size={32}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
            <View style={styles.timeValueContainer}>
              <Text style={styles.timeValueText}>{padTwo(seconds)}</Text>
            </View>
            <TouchableOpacity
              style={styles.chevronButton}
              onPress={decrementSeconds}
            >
              <MaterialCommunityIcons
                name="chevron-down"
                size={32}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preset Buttons */}
        <View style={styles.presetRow}>
          {TIMER_PRESETS.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={styles.presetChip}
              onPress={() => handlePresetSelect(preset)}
            >
              <Text style={styles.presetChipText}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            (hours === 0 && minutes === 0 && seconds === 0) && styles.startButtonDisabled,
          ]}
          onPress={handleStart}
          activeOpacity={0.8}
          disabled={hours === 0 && minutes === 0 && seconds === 0}
        >
          <MaterialCommunityIcons name="play" size={22} color={COLORS.white} />
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  headerTitlePrefix: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryLight,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  pumpName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xl,
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
  timerDisplayContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.xxxl,
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  timerDisplayText: {
    fontSize: FONT_SIZES.hero,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: 4,
  },
  timeSetterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  timeColumn: {
    alignItems: 'center',
    width: 80,
  },
  timeColumnLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chevronButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValueContainer: {
    width: 72,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeValueText: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  timeSeparator: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginTop: SPACING.xxl,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xxxl,
  },
  presetChip: {
    paddingHorizontal: SPACING.xl,
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.background,
    opacity: 0.6,
  },
  startButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default PumpTimerScreen;
