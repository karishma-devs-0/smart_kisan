import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS } from '../../constants/layout';

const pad = (num) => String(num).padStart(2, '0');

const TimerDisplay = ({
  hours = 0,
  minutes = 0,
  seconds = 0,
  totalSeconds = 0,
  isRunning = false,
  onStart,
  onPause,
  onReset,
  progress = 0,
}) => {
  const timerText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const fillPercentage = Math.min(progress * 100, 100);

  return (
    <View style={styles.container}>
      <AnimatedCircularProgress
        size={200}
        width={8}
        fill={fillPercentage}
        tintColor={COLORS.primary}
        backgroundColor={COLORS.divider}
        rotation={0}
        lineCap="round"
        duration={300}
      >
        {() => (
          <View style={styles.timerCenter}>
            <Text style={styles.timerText}>{timerText}</Text>
            {totalSeconds > 0 && (
              <Text style={styles.totalText}>
                of {pad(Math.floor(totalSeconds / 3600))}:
                {pad(Math.floor((totalSeconds % 3600) / 60))}:
                {pad(totalSeconds % 60)}
              </Text>
            )}
          </View>
        )}
      </AnimatedCircularProgress>

      <View style={styles.buttonsRow}>
        {!isRunning ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={onStart}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="play" size={24} color={COLORS.white} />
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.pauseButton]}
            onPress={onPause}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="pause" size={24} color={COLORS.warning} />
            <Text style={styles.pauseButtonText}>Pause</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.resetButton]}
          onPress={onReset}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="restart" size={24} color={COLORS.textSecondary} />
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  timerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  totalText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  buttonsRow: {
    flexDirection: 'row',
    marginTop: SPACING.xxl,
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  startButton: {
    backgroundColor: COLORS.primary,
  },
  startButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
  pauseButton: {
    backgroundColor: '#FFF3E0',
  },
  pauseButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.warning,
  },
  resetButton: {
    backgroundColor: COLORS.background,
  },
  resetButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
  },
});

export default TimerDisplay;
