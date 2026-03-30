import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import {
  togglePump,
  controlPump,
  setPumpMode,
  createSchedule,
  deleteSchedule,
  updatePumpStatusFromMQTT,
} from '../slice/pumpsSlice';
import { FIREBASE_ENABLED } from '../../../services/firebase';
import { onPumpStatus, sendPumpCommand } from '../../../services/mqtt';

// ─── Mode constants ─────────────────────────────────────────────────────────

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

const MODE_DESCRIPTIONS = {
  manual: 'Tap to turn on/off',
  automatic: 'Runs daily on schedule',
  timer: 'Run for a set duration',
  schedule: 'Weekly schedule control',
  sensor: 'Sensor-driven automation',
  ai: 'AI-optimized irrigation',
};

const ALL_MODES = ['manual', 'automatic', 'timer', 'schedule', 'sensor', 'ai'];

const TIMER_PRESETS = [
  { label: '15 min', display: '00:15:00', seconds: 900 },
  { label: '30 min', display: '00:30:00', seconds: 1800 },
  { label: '1 hr', display: '01:00:00', seconds: 3600 },
  { label: '2 hr', display: '02:00:00', seconds: 7200 },
];

// ─── Component ──────────────────────────────────────────────────────────────

const PumpDetailScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { pumpId } = route.params || {};
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const pump = useSelector((state) =>
    state.pumps.pumps.find((p) => p.id === pumpId),
  ) || {
    id: pumpId,
    name: `Pump ${pumpId}`,
    field: t('pumps.noFieldAssigned'),
    status: 'off',
    mode: 'manual',
    hp: 5,
    type: 'submersible',
    lastRun: null,
    nextRun: null,
    soilMoisture: 42,
    waterLevel: 78,
  };

  const activeTimers = useSelector((state) => state.pumps.activeTimers);
  const schedules = useSelector((state) => state.pumps.schedules[pumpId] || []);
  const mode = pump.mode || 'manual';

  // Local state
  const [modeModalVisible, setModeModalVisible] = useState(false);
  const [soilMoistureEnabled, setSoilMoistureEnabled] = useState(false);
  const [waterLevelEnabled, setWaterLevelEnabled] = useState(false);
  const [scheduleStart, setScheduleStart] = useState('06:00');
  const [scheduleStop, setScheduleStop] = useState('08:00');
  const [scheduleDays, setScheduleDays] = useState([1, 2, 3, 4, 5]);
  const [autoStart, setAutoStart] = useState('06:00');
  const [autoStop, setAutoStop] = useState('07:00');
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [customHours, setCustomHours] = useState('00');
  const [customMinutes, setCustomMinutes] = useState('30');
  const [customSeconds, setCustomSeconds] = useState('00');

  // ─── MQTT subscription ──────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onPumpStatus(pumpId, (data) => {
      const status = typeof data === 'string' ? data : data?.status;
      if (status) {
        dispatch(updatePumpStatusFromMQTT({ pumpId, status }));
      }
    });
    return unsub;
  }, [pumpId, dispatch]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleToggle = () => {
    const newAction = pump.status === 'on' ? 'off' : 'on';
    sendPumpCommand(pumpId, newAction);
    if (FIREBASE_ENABLED) {
      dispatch(controlPump({ pumpId, action: newAction }));
    } else {
      dispatch(togglePump(pumpId));
    }
  };

  const handleEmergencyStop = () => {
    sendPumpCommand(pumpId, 'off');
    if (FIREBASE_ENABLED) {
      dispatch(controlPump({ pumpId, action: 'off' }));
    } else {
      if (pump.status === 'on') dispatch(togglePump(pumpId));
    }
  };

  const handleModeChange = (newMode) => {
    const hasActiveSchedules = schedules.length > 0;
    const hasActiveTimer = activeTimers[pumpId] !== undefined;

    if ((mode === 'schedule' && hasActiveSchedules) || (mode === 'timer' && hasActiveTimer)) {
      Alert.alert(
        'Change Mode',
        'Active schedules/timers will be paused when switching modes. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              dispatch(setPumpMode({ pumpId, mode: newMode }));
              setModeModalVisible(false);
            },
          },
        ],
      );
    } else {
      dispatch(setPumpMode({ pumpId, mode: newMode }));
      setModeModalVisible(false);
    }
  };

  const formatLastRun = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diffH = Math.round((now - d) / (1000 * 60 * 60));
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.round(diffH / 24)}d ago`;
  };

  // ─── Mode Content Renderers ─────────────────────────────────────────────

  const renderManualMode = () => (
    <View style={styles.modeContent}>
      {/* Large power button */}
      <View style={styles.manualCenter}>
        <TouchableOpacity
          style={[
            styles.powerButton,
            { borderColor: pump.status === 'on' ? COLORS.primaryLight : '#BDBDBD' },
          ]}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="power"
            size={64}
            color={pump.status === 'on' ? COLORS.primaryLight : '#BDBDBD'}
          />
        </TouchableOpacity>
        <Text style={[styles.powerLabel, pump.status === 'on' && { color: COLORS.primaryLight }]}>
          {pump.status === 'on' ? 'RUNNING' : 'OFF'}
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="engine" size={20} color={COLORS.textSecondary} />
          <Text style={styles.statValue}>{pump.hp || 5} HP</Text>
          <Text style={styles.statLabel}>Power</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="water-pump" size={20} color={COLORS.textSecondary} />
          <Text style={styles.statValue}>{pump.type || 'submersible'}</Text>
          <Text style={styles.statLabel}>Type</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="history" size={20} color={COLORS.textSecondary} />
          <Text style={styles.statValue}>{formatLastRun(pump.lastRun)}</Text>
          <Text style={styles.statLabel}>Last Run</Text>
        </View>
      </View>
    </View>
  );

  const renderTimerMode = () => {
    const timerActive = activeTimers[pumpId] !== undefined;
    const remaining = activeTimers[pumpId] || 0;
    const rh = String(Math.floor(remaining / 3600)).padStart(2, '0');
    const rm = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
    const rs = String(remaining % 60).padStart(2, '0');

    return (
      <View style={styles.modeContent}>
        {timerActive && (
          <View style={styles.activeTimerBanner}>
            <MaterialCommunityIcons name="timer-sand" size={20} color={COLORS.white} />
            <Text style={styles.activeTimerText}>
              Timer Active: {rh}:{rm}:{rs}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Quick Start</Text>
        <View style={styles.presetRow}>
          {TIMER_PRESETS.map((preset, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.presetChip}
              onPress={() =>
                navigation.navigate('TimerCountdown', {
                  pumpId,
                  duration: preset.seconds,
                })
              }
            >
              <Text style={styles.presetChipText}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Custom Timer</Text>
        <View style={styles.customTimerRow}>
          <View style={styles.customTimerBlock}>
            <Text style={styles.customTimerLabel}>HH</Text>
            <View style={styles.customTimerInput}>
              <Text style={styles.customTimerValue}>{customHours}</Text>
            </View>
          </View>
          <Text style={styles.customTimerColon}>:</Text>
          <View style={styles.customTimerBlock}>
            <Text style={styles.customTimerLabel}>MM</Text>
            <View style={styles.customTimerInput}>
              <Text style={styles.customTimerValue}>{customMinutes}</Text>
            </View>
          </View>
          <Text style={styles.customTimerColon}>:</Text>
          <View style={styles.customTimerBlock}>
            <Text style={styles.customTimerLabel}>SS</Text>
            <View style={styles.customTimerInput}>
              <Text style={styles.customTimerValue}>{customSeconds}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: MODE_COLORS.timer }]}
          onPress={() => {
            const totalSec =
              parseInt(customHours, 10) * 3600 +
              parseInt(customMinutes, 10) * 60 +
              parseInt(customSeconds, 10);
            if (totalSec > 0) {
              navigation.navigate('TimerCountdown', { pumpId, duration: totalSec });
            }
          }}
        >
          <MaterialCommunityIcons name="timer-outline" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Start Timer</Text>
        </TouchableOpacity>

        {pump.lastRun && (
          <View style={styles.lastRunRow}>
            <MaterialCommunityIcons name="history" size={16} color={COLORS.textSecondary} />
            <Text style={styles.lastRunText}>Last run: {formatLastRun(pump.lastRun)}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderScheduleMode = () => (
    <View style={styles.modeContent}>
      <Text style={styles.sectionTitle}>Add Schedule</Text>
      <View style={styles.scheduleForm}>
        <View style={styles.scheduleTimeRow}>
          <View style={styles.scheduleTimeBlock}>
            <Text style={styles.scheduleLabel}>Start</Text>
            <TouchableOpacity style={styles.scheduleTimeBtn}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.primaryLight} />
              <Text style={styles.scheduleTimeText}>{scheduleStart}</Text>
            </TouchableOpacity>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.textSecondary} />
          <View style={styles.scheduleTimeBlock}>
            <Text style={styles.scheduleLabel}>Stop</Text>
            <TouchableOpacity style={styles.scheduleTimeBtn}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.danger} />
              <Text style={styles.scheduleTimeText}>{scheduleStop}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Day selector */}
        <Text style={[styles.scheduleLabel, { marginTop: SPACING.md }]}>Repeat</Text>
        <View style={styles.daysRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.dayChip, scheduleDays.includes(idx) && styles.dayChipActive]}
              onPress={() => {
                setScheduleDays((prev) =>
                  prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx],
                );
              }}
            >
              <Text
                style={[styles.dayChipText, scheduleDays.includes(idx) && styles.dayChipTextActive]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: MODE_COLORS.schedule }]}
          onPress={() => {
            const now = new Date();
            const [sh, sm] = scheduleStart.split(':').map(Number);
            const [eh, em] = scheduleStop.split(':').map(Number);
            const start = new Date(now);
            start.setHours(sh, sm, 0, 0);
            if (start <= now) start.setDate(start.getDate() + 1);
            const stop = new Date(start);
            stop.setHours(eh, em, 0, 0);
            if (stop <= start) stop.setDate(stop.getDate() + 1);
            dispatch(
              createSchedule({
                pumpId,
                schedule: {
                  startTime: start.toISOString(),
                  stopTime: stop.toISOString(),
                  repeat: scheduleDays.length === 7 ? 'daily' : 'weekly',
                  days: scheduleDays,
                },
              }),
            );
          }}
        >
          <MaterialCommunityIcons name="calendar-plus" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Add Schedule</Text>
        </TouchableOpacity>
      </View>

      {/* Next scheduled run */}
      {pump.nextRun && (
        <View style={styles.nextRunCard}>
          <MaterialCommunityIcons name="calendar-arrow-right" size={20} color={MODE_COLORS.schedule} />
          <View style={{ flex: 1, marginLeft: SPACING.sm }}>
            <Text style={styles.nextRunLabel}>Next Scheduled Run</Text>
            <Text style={styles.nextRunTime}>
              {new Date(pump.nextRun).toLocaleString([], {
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      )}

      {/* Active schedules */}
      {schedules.length > 0 && (
        <View style={{ marginTop: SPACING.lg }}>
          <Text style={styles.sectionTitle}>Active Schedules</Text>
          {schedules.map((s) => (
            <View key={s.id} style={styles.scheduleCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleCardTime}>
                  {new Date(
                    s.startTime?._seconds ? s.startTime._seconds * 1000 : s.startTime,
                  ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' \u2192 '}
                  {new Date(
                    s.stopTime?._seconds ? s.stopTime._seconds * 1000 : s.stopTime,
                  ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.scheduleCardRepeat}>
                  {s.repeat || 'once'} \u2022 {(s.days || []).length} days
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => dispatch(deleteSchedule({ pumpId, scheduleId: s.id }))}
              >
                <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderSensorMode = () => (
    <View style={styles.modeContent}>
      <Text style={styles.sectionTitle}>Sensor Readings</Text>

      {/* Soil Moisture card */}
      <View style={styles.sensorCard}>
        <View style={styles.sensorCardHeader}>
          <View style={[styles.sensorIconContainer, { backgroundColor: 'rgba(33,150,243,0.1)' }]}>
            <MaterialCommunityIcons name="water-percent" size={24} color="#2196F3" />
          </View>
          <View style={styles.sensorInfo}>
            <Text style={styles.sensorTitle}>Soil Moisture</Text>
            <Text style={styles.sensorValue}>{pump.soilMoisture || 42}%</Text>
          </View>
          <Switch
            value={soilMoistureEnabled}
            onValueChange={setSoilMoistureEnabled}
            trackColor={{ false: COLORS.background, true: COLORS.primaryLight }}
            thumbColor={COLORS.white}
          />
        </View>
        {soilMoistureEnabled && (
          <View style={styles.thresholdInfo}>
            <Text style={styles.thresholdText}>
              Turn ON below 30% \u2022 Turn OFF above 60%
            </Text>
            <TouchableOpacity
              style={styles.thresholdButton}
              onPress={() => navigation.navigate('SoilMoistureControl', { pumpId })}
            >
              <Text style={styles.thresholdButtonText}>Adjust Thresholds</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={MODE_COLORS.sensor} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Water Level card */}
      <View style={styles.sensorCard}>
        <View style={styles.sensorCardHeader}>
          <View style={[styles.sensorIconContainer, { backgroundColor: 'rgba(33,150,243,0.1)' }]}>
            <MaterialCommunityIcons name="water" size={24} color={COLORS.info} />
          </View>
          <View style={styles.sensorInfo}>
            <Text style={styles.sensorTitle}>Water Level</Text>
            <Text style={styles.sensorValue}>{pump.waterLevel || 78}%</Text>
          </View>
          <Switch
            value={waterLevelEnabled}
            onValueChange={setWaterLevelEnabled}
            trackColor={{ false: COLORS.background, true: COLORS.primaryLight }}
            thumbColor={COLORS.white}
          />
        </View>
        {waterLevelEnabled && (
          <View style={styles.thresholdInfo}>
            <Text style={styles.thresholdText}>
              Stop pump when water level below 20%
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderAIMode = () => (
    <View style={styles.modeContent}>
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <View style={[styles.aiIconBg, { backgroundColor: MODE_COLORS.ai }]}>
            <MaterialCommunityIcons name="robot" size={28} color={COLORS.white} />
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={styles.aiTitle}>AI Smart Irrigation</Text>
            <Text style={styles.aiSubtitle}>
              AI analyzes soil, weather & crop data to optimize irrigation
            </Text>
          </View>
        </View>

        <View style={styles.aiStatsRow}>
          <View style={styles.aiStat}>
            <MaterialCommunityIcons name="water-percent" size={20} color="#2196F3" />
            <Text style={styles.aiStatValue}>{pump.soilMoisture || 42}%</Text>
            <Text style={styles.aiStatLabel}>Moisture</Text>
          </View>
          <View style={styles.aiStat}>
            <MaterialCommunityIcons name="thermometer" size={20} color="#FF9800" />
            <Text style={styles.aiStatValue}>32\u00B0C</Text>
            <Text style={styles.aiStatLabel}>Temperature</Text>
          </View>
          <View style={styles.aiStat}>
            <MaterialCommunityIcons name="weather-cloudy" size={20} color="#9C27B0" />
            <Text style={styles.aiStatValue}>15%</Text>
            <Text style={styles.aiStatLabel}>Rain Chance</Text>
          </View>
        </View>

        <View style={styles.aiRecommendation}>
          <MaterialCommunityIcons name="lightbulb-on" size={18} color="#FF9800" />
          <Text style={styles.aiRecText}>
            {(pump.soilMoisture || 42) < 40
              ? 'Soil moisture is low. Recommended: Run pump for 45 minutes.'
              : 'Soil moisture is adequate. No irrigation needed right now.'}
          </Text>
        </View>

        {/* Weather snippet */}
        <View style={styles.weatherSnippet}>
          <MaterialCommunityIcons name="weather-partly-cloudy" size={18} color={COLORS.textSecondary} />
          <Text style={styles.weatherSnippetText}>
            Today: 32\u00B0C, Partly Cloudy \u2022 Tomorrow: 30\u00B0C, Rain likely
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor:
                (pump.soilMoisture || 42) >= 40 ? COLORS.textSecondary : MODE_COLORS.ai,
            },
          ]}
          onPress={() => {
            sendPumpCommand(pumpId, pump.status === 'on' ? 'off' : 'on');
            if (FIREBASE_ENABLED) {
              dispatch(controlPump({ pumpId, action: pump.status === 'on' ? 'off' : 'on' }));
            } else {
              dispatch(togglePump(pumpId));
            }
          }}
        >
          <MaterialCommunityIcons
            name={pump.status === 'on' ? 'stop' : 'play'}
            size={20}
            color={COLORS.white}
          />
          <Text style={styles.actionButtonText}>
            {pump.status === 'on' ? 'Stop AI Irrigation' : 'Start AI Irrigation'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAutomaticMode = () => (
    <View style={styles.modeContent}>
      <View style={styles.autoCard}>
        <View style={styles.autoHeaderRow}>
          <Text style={styles.sectionTitle}>Daily Schedule</Text>
          <Switch
            value={autoEnabled}
            onValueChange={setAutoEnabled}
            trackColor={{ false: COLORS.background, true: MODE_COLORS.automatic }}
            thumbColor={COLORS.white}
          />
        </View>

        <View style={[styles.scheduleTimeRow, { opacity: autoEnabled ? 1 : 0.5 }]}>
          <View style={styles.scheduleTimeBlock}>
            <Text style={styles.scheduleLabel}>Start</Text>
            <TouchableOpacity style={styles.scheduleTimeBtn} disabled={!autoEnabled}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={MODE_COLORS.automatic} />
              <Text style={styles.scheduleTimeText}>{autoStart}</Text>
            </TouchableOpacity>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.textSecondary} />
          <View style={styles.scheduleTimeBlock}>
            <Text style={styles.scheduleLabel}>Stop</Text>
            <TouchableOpacity style={styles.scheduleTimeBtn} disabled={!autoEnabled}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.danger} />
              <Text style={styles.scheduleTimeText}>{autoStop}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {autoEnabled && (
          <View style={styles.autoStatusRow}>
            <MaterialCommunityIcons name="check-circle" size={18} color={MODE_COLORS.automatic} />
            <Text style={styles.autoStatusText}>
              Runs daily at {autoStart} - {autoStop}
            </Text>
          </View>
        )}

        {pump.nextRun && (
          <View style={styles.nextRunCard}>
            <MaterialCommunityIcons
              name="calendar-arrow-right"
              size={20}
              color={MODE_COLORS.automatic}
            />
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={styles.nextRunLabel}>Next Run</Text>
              <Text style={styles.nextRunTime}>
                {new Date(pump.nextRun).toLocaleString([], {
                  weekday: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderModeContent = () => {
    switch (mode) {
      case 'manual':
        return renderManualMode();
      case 'timer':
        return renderTimerMode();
      case 'schedule':
        return renderScheduleMode();
      case 'sensor':
        return renderSensorMode();
      case 'ai':
        return renderAIMode();
      case 'automatic':
        return renderAutomaticMode();
      default:
        return renderManualMode();
    }
  };

  // ─── Change Mode Modal ─────────────────────────────────────────────────

  const renderModeModal = () => (
    <Modal
      visible={modeModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setModeModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setModeModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Change Mode</Text>
          <Text style={styles.modalSubtitle}>Select how this pump should operate</Text>

          <View style={styles.modeGrid}>
            {ALL_MODES.map((m) => {
              const isActive = m === mode;
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.modeGridCard,
                    isActive && { borderColor: MODE_COLORS[m], borderWidth: 2 },
                  ]}
                  onPress={() => {
                    if (!isActive) handleModeChange(m);
                  }}
                  activeOpacity={0.7}
                >
                  {isActive && (
                    <View style={[styles.modeCheckmark, { backgroundColor: MODE_COLORS[m] }]}>
                      <MaterialCommunityIcons name="check" size={12} color={COLORS.white} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.modeGridIcon,
                      { backgroundColor: MODE_COLORS[m] + '20' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={MODE_ICONS[m]}
                      size={24}
                      color={MODE_COLORS[m]}
                    />
                  </View>
                  <Text style={styles.modeGridName}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                  <Text style={styles.modeGridDesc}>{MODE_DESCRIPTIONS[m]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setModeModalVisible(false)}
          >
            <Text style={styles.modalCloseBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ─── Main Render ────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {pump.name}
        </Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('EditPump', { pumpId })}
        >
          <MaterialCommunityIcons name="pencil" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setModeModalVisible(true)}
        >
          <MaterialCommunityIcons name="cog-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Row */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.pumpIconContainer,
              {
                backgroundColor:
                  pump.status === 'on'
                    ? COLORS.primaryLight + '20'
                    : COLORS.background,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="water-pump"
              size={32}
              color={pump.status === 'on' ? COLORS.primaryLight : COLORS.textSecondary}
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.pumpName}>{pump.name}</Text>
            <Text style={styles.pumpField}>{pump.field || t('pumps.noFieldAssigned')}</Text>
            <View style={styles.badgeRow}>
              {/* Status badge */}
              <View
                style={[
                  styles.statusBadge,
                  pump.status === 'on' && styles.statusBadgeOn,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: pump.status === 'on' ? COLORS.primaryLight : '#BDBDBD' },
                  ]}
                />
                <Text
                  style={[styles.statusText, pump.status === 'on' && styles.statusTextOn]}
                >
                  {pump.status === 'on' ? 'Running' : 'Idle'}
                </Text>
              </View>
              {/* Mode badge */}
              <View style={[styles.modeBadge, { backgroundColor: MODE_COLORS[mode] + '20' }]}>
                <MaterialCommunityIcons
                  name={MODE_ICONS[mode]}
                  size={12}
                  color={MODE_COLORS[mode]}
                />
                <Text style={[styles.modeBadgeText, { color: MODE_COLORS[mode] }]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Mode-driven content */}
        {renderModeContent()}
      </ScrollView>

      {/* Emergency Stop */}
      <TouchableOpacity
        style={[styles.emergencyButton, { marginBottom: insets.bottom + 8 }]}
        onPress={handleEmergencyStop}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="stop-circle" size={20} color={COLORS.white} />
        <Text style={styles.emergencyText}>Emergency Stop</Text>
      </TouchableOpacity>

      {/* Mode change modal */}
      {renderModeModal()}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
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
    backgroundColor: COLORS.white,
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
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },

  // Status row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  pumpIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  statusInfo: {
    flex: 1,
  },
  pumpName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  pumpField: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    gap: 4,
  },
  statusBadgeOn: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  statusTextOn: {
    color: COLORS.primaryLight,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  modeBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // Mode content wrapper
  modeContent: {
    marginTop: SPACING.sm,
  },

  // Section title
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },

  // ─── Manual mode ────────────────────────────────────────────────────────
  manualCenter: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  powerButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    ...SHADOWS.md,
  },
  powerLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },

  // ─── Timer mode ─────────────────────────────────────────────────────────
  activeTimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  activeTimerText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  presetRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  presetChip: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: MODE_COLORS.timer,
    backgroundColor: MODE_COLORS.timer + '15',
    alignItems: 'center',
  },
  presetChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: MODE_COLORS.timer,
  },
  customTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  customTimerBlock: {
    alignItems: 'center',
  },
  customTimerLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  customTimerInput: {
    width: 60,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTimerValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  customTimerColon: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.sm,
    marginTop: SPACING.md,
  },
  lastRunRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.xs,
  },
  lastRunText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // ─── Schedule mode ──────────────────────────────────────────────────────
  scheduleForm: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  scheduleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  scheduleTimeBlock: {
    flex: 1,
    alignItems: 'center',
  },
  scheduleLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  scheduleTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  scheduleTimeText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  dayChipActive: {
    backgroundColor: MODE_COLORS.schedule,
  },
  dayChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  dayChipTextActive: {
    color: COLORS.white,
  },
  nextRunCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  nextRunLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  nextRunTime: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  scheduleCardTime: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  scheduleCardRepeat: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // ─── Sensor mode ────────────────────────────────────────────────────────
  sensorCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  sensorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
  sensorValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  thresholdInfo: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  thresholdText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  thresholdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  thresholdButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: MODE_COLORS.sensor,
  },

  // ─── AI mode ────────────────────────────────────────────────────────────
  aiCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  aiIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  aiSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  aiStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  aiStat: {
    alignItems: 'center',
  },
  aiStatValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  aiStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  aiRecommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  aiRecText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  weatherSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  weatherSnippetText: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },

  // ─── Automatic mode ─────────────────────────────────────────────────────
  autoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  autoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  autoStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  autoStatusText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // ─── Shared action button ──────────────────────────────────────────────
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },

  // ─── Emergency Stop ────────────────────────────────────────────────────
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

  // ─── Mode Modal ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xxl,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  modeGridCard: {
    width: '47%',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  modeCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeGridIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  modeGridName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  modeGridDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalCloseBtn: {
    marginTop: SPACING.xxl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
});

export default PumpDetailScreen;
