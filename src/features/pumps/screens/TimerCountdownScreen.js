import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { useTranslation } from 'react-i18next';
import { startTimer, tickTimer, stopTimer, startPumpTimer, stopPumpTimer } from '../slice/pumpsSlice';
import { FIREBASE_ENABLED } from '../../../services/firebase';
import { sendPumpTimer, sendPumpCommand } from '../../../services/mqtt';

const RING_SIZE = 240;
const STROKE_WIDTH = 10;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const TimerCountdownScreen = ({ navigation, route }) => {
  const { pumpId, totalSeconds } = route.params || {};
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const pump = useSelector((state) =>
    state.pumps.pumps.find((p) => p.id === pumpId),
  ) || { id: pumpId, name: `Pump ${pumpId}` };

  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const intervalRef = useRef(null);

  const padTwo = (num) => String(num).padStart(2, '0');

  const formatTime = useCallback((total) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${padTwo(h)}:${padTwo(m)}:${padTwo(s)}`;
  }, []);

  const elapsed = totalSeconds - remainingSeconds;
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const progressPercent = Math.round(progress * 100);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (remainingSeconds <= 0 && isStarted) {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      sendPumpCommand(pumpId, 'off');
      if (FIREBASE_ENABLED) {
        dispatch(stopPumpTimer(pumpId));
      } else {
        dispatch(stopTimer(pumpId));
      }
      Alert.alert(
        t('timerCountdown.timerComplete'),
        t('timerCountdown.timerFinishedMsg', { pumpName: pump.name }),
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    }
  }, [remainingSeconds, isStarted, dispatch, pumpId, pump.name, navigation]);

  const handleStartPause = () => {
    if (isRunning) {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      if (!isStarted) {
        sendPumpTimer(pumpId, totalSeconds);
        if (FIREBASE_ENABLED) {
          dispatch(startPumpTimer({ pumpId, durationSeconds: totalSeconds }));
        } else {
          dispatch(startTimer({ pumpId, seconds: totalSeconds }));
        }
        setIsStarted(true);
      }
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            return 0;
          }
          dispatch(tickTimer(pumpId));
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsStarted(false);
    setRemainingSeconds(totalSeconds);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    sendPumpCommand(pumpId, 'off');
    if (FIREBASE_ENABLED) {
      dispatch(stopPumpTimer(pumpId));
    } else {
      dispatch(stopTimer(pumpId));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            handleReset();
            navigation.goBack();
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('timerCountdown.timer')}</Text>
      </View>

      <View style={styles.content}>
        {/* SVG Circular Progress Ring */}
        <View style={styles.ringContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Background circle */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={COLORS.border}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={COLORS.primary}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          {/* Center content */}
          <View style={styles.ringCenter}>
            <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
            <Text style={styles.progressPercentText}>{progressPercent}%</Text>
          </View>
        </View>

        {/* Pump Info */}
        <View style={styles.pumpInfoContainer}>
          <Text style={styles.pumpNameText}>{pump.name}</Text>
          <View style={styles.modeBadge}>
            <MaterialCommunityIcons name="timer-outline" size={14} color={COLORS.primaryLight} />
            <Text style={styles.modeBadgeText}>{t('timerCountdown.timerMode')}</Text>
          </View>
        </View>

        {/* Status label */}
        <Text style={styles.progressLabel}>
          {isStarted
            ? isRunning
              ? t('timerCountdown.running')
              : t('timerCountdown.paused')
            : t('timerCountdown.readyToStart')}
        </Text>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.7}>
            <MaterialCommunityIcons name="restart" size={22} color={COLORS.textPrimary} />
            <Text style={styles.resetButtonText}>{t('timerCountdown.reset')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startPauseButton} onPress={handleStartPause} activeOpacity={0.8}>
            <MaterialCommunityIcons name={isRunning ? 'pause' : 'play'} size={24} color={COLORS.white} />
            <Text style={styles.startPauseButtonText}>
              {isRunning ? t('timerCountdown.pause') : t('timerCountdown.start')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxxl,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 36,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  progressPercentText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primaryLight,
    marginTop: SPACING.xs,
  },
  pumpInfoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  pumpNameText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  modeBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primaryLight,
  },
  progressLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxxl,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    width: '100%',
    paddingHorizontal: SPACING.lg,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
  },
  resetButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  startPauseButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  startPauseButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default TimerCountdownScreen;
