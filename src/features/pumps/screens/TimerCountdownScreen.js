import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { startTimer, tickTimer, stopTimer } from '../slice/pumpsSlice';

const RING_SIZE = 260;
const RING_BORDER = 8;

const TimerCountdownScreen = ({ navigation, route }) => {
  const { pumpId, totalSeconds, hours = 0, minutes = 0, seconds = 0 } = route.params;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const pump = useSelector((state) =>
    state.pumps.pumps.find((p) => p.id === pumpId),
  ) || { id: pumpId, name: `Pump ${pumpId}` };

  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const intervalRef = useRef(null);

  const initialTotal = totalSeconds;

  const padTwo = (num) => String(num).padStart(2, '0');

  const formatTime = useCallback((total) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${padTwo(h)}:${padTwo(m)}:${padTwo(s)}`;
  }, []);

  const progress = initialTotal > 0 ? ((initialTotal - remainingSeconds) / initialTotal) * 100 : 0;
  const progressPercent = Math.round(progress);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (remainingSeconds <= 0 && isStarted) {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      dispatch(stopTimer(pumpId));
      Alert.alert(
        'Timer Complete',
        `${pump.name} timer has finished. The pump has been turned off.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    }
  }, [remainingSeconds, isStarted, dispatch, pumpId, pump.name, navigation]);

  const handleStartPause = () => {
    if (isRunning) {
      // Pause
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Start
      if (!isStarted) {
        dispatch(startTimer({ pumpId, seconds: totalSeconds }));
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
    dispatch(stopTimer(pumpId));
  };

  // Calculate the rotation angle for the progress indicator
  const progressAngle = (progress / 100) * 360;

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
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Timer</Text>
      </View>

      <View style={styles.content}>
        {/* Circular Progress Ring */}
        <View style={styles.ringOuterContainer}>
          {/* Background ring */}
          <View style={styles.ringBackground}>
            {/* Progress ring overlay using border trick */}
            <View style={styles.ringProgressContainer}>
              {/* Left half */}
              <View style={styles.ringHalfContainer}>
                <View
                  style={[
                    styles.ringHalf,
                    styles.ringHalfLeft,
                    {
                      borderColor: COLORS.primaryLight,
                      transform: [
                        {
                          rotate:
                            progressAngle > 180
                              ? `${progressAngle - 180}deg`
                              : '0deg',
                        },
                      ],
                      opacity: progressAngle > 180 ? 1 : 0,
                    },
                  ]}
                />
              </View>
              {/* Right half */}
              <View style={[styles.ringHalfContainer, styles.ringHalfContainerRight]}>
                <View
                  style={[
                    styles.ringHalf,
                    styles.ringHalfRight,
                    {
                      borderColor: COLORS.primaryLight,
                      transform: [
                        {
                          rotate:
                            progressAngle <= 180
                              ? `${progressAngle}deg`
                              : '180deg',
                        },
                      ],
                    },
                  ]}
                />
              </View>
            </View>

            {/* Inner circle (covers center) */}
            <View style={styles.ringInner}>
              <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
              <Text style={styles.progressPercentText}>{progressPercent}%</Text>
            </View>
          </View>
        </View>

        {/* Pump Info */}
        <View style={styles.pumpInfoContainer}>
          <Text style={styles.pumpNameText}>{pump.name}</Text>
          <View style={styles.modeBadge}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={14}
              color={COLORS.primaryLight}
            />
            <Text style={styles.modeBadgeText}>Timer Mode</Text>
          </View>
        </View>

        {/* Progress percentage */}
        <Text style={styles.progressLabel}>
          {isStarted
            ? isRunning
              ? 'Running...'
              : 'Paused'
            : 'Ready to start'}
        </Text>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="restart"
              size={22}
              color={COLORS.textPrimary}
            />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.startPauseButton}
            onPress={handleStartPause}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isRunning ? 'pause' : 'play'}
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.startPauseButtonText}>
              {isRunning ? 'Pause' : 'Start'}
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
  ringOuterContainer: {
    marginBottom: SPACING.xxxl,
  },
  ringBackground: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_BORDER,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ringProgressContainer: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    flexDirection: 'row',
  },
  ringHalfContainer: {
    width: RING_SIZE / 2,
    height: RING_SIZE,
    overflow: 'hidden',
  },
  ringHalfContainerRight: {},
  ringHalf: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderWidth: RING_BORDER,
    borderRadius: RING_SIZE / 2,
    borderColor: 'transparent',
  },
  ringHalfLeft: {
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
    right: 0,
    transformOrigin: 'center',
  },
  ringHalfRight: {
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    position: 'absolute',
    left: 0,
    transformOrigin: 'center',
  },
  ringInner: {
    width: RING_SIZE - RING_BORDER * 4,
    height: RING_SIZE - RING_BORDER * 4,
    borderRadius: (RING_SIZE - RING_BORDER * 4) / 2,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timerText: {
    fontSize: FONT_SIZES.display,
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
