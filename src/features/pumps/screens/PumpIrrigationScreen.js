import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchSchedules, addSchedule, stopAllPumpsAsync, stopAllPumps } from '../slice/pumpsSlice';
import { FIREBASE_ENABLED } from '../../../services/firebase';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getScheduleStatus = (schedule) => {
  if (!schedule.startTime || !schedule.stopTime) return 'scheduled';
  const now = new Date();
  const start = schedule.startTime._seconds
    ? new Date(schedule.startTime._seconds * 1000)
    : new Date(schedule.startTime);
  const stop = schedule.stopTime._seconds
    ? new Date(schedule.stopTime._seconds * 1000)
    : new Date(schedule.stopTime);

  if (now >= start && now <= stop) return 'active';
  if (now > stop) return 'completed';
  return 'scheduled';
};

const formatScheduleTime = (timeVal) => {
  if (!timeVal) return '--:--';
  const d = timeVal._seconds ? new Date(timeVal._seconds * 1000) : new Date(timeVal);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return COLORS.success;
    case 'active': return COLORS.info;
    case 'scheduled': return COLORS.warning;
    default: return COLORS.textSecondary;
  }
};

const PumpIrrigationScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { pumpId } = route.params || {};
  const pump = useSelector((s) => s.pumps.pumps.find((p) => p.id === pumpId)) || { name: 'Pump' };
  const schedules = useSelector((s) => s.pumps.schedules[pumpId] || []);
  const loading = useSelector((s) => s.pumps.loading);
  const forecast = useSelector((s) => s.weather.forecast);

  const [showAddModal, setShowAddModal] = useState(false);
  const [startHour, setStartHour] = useState('06');
  const [startMin, setStartMin] = useState('00');
  const [stopHour, setStopHour] = useState('07');
  const [stopMin, setStopMin] = useState('00');
  const [selectedDays, setSelectedDays] = useState([]);
  const [repeatMode, setRepeatMode] = useState('daily');

  useEffect(() => {
    dispatch(fetchSchedules(pumpId));
  }, [dispatch, pumpId]);

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleAddSchedule = () => {
    const rainMm = forecast?.[0]?.precipitation || 0;
    if (rainMm >= 10) {
      Alert.alert(
        'Rain forecast',
        `~${rainMm}mm rain is expected tomorrow. Schedule irrigation anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Schedule anyway', onPress: commitSchedule },
        ],
      );
      return;
    }
    commitSchedule();
  };

  const commitSchedule = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(parseInt(startHour, 10), parseInt(startMin, 10), 0, 0);
    const stop = new Date(now);
    stop.setHours(parseInt(stopHour, 10), parseInt(stopMin, 10), 0, 0);

    if (stop <= start) {
      Alert.alert('Invalid Time', 'Stop time must be after start time.');
      return;
    }

    dispatch(addSchedule({
      pumpId,
      schedule: {
        startTime: start.toISOString(),
        stopTime: stop.toISOString(),
        repeat: repeatMode,
        days: repeatMode === 'custom' ? selectedDays : DAYS,
        enabled: true,
      },
    }));

    setShowAddModal(false);
    setStartHour('06');
    setStartMin('00');
    setStopHour('07');
    setStopMin('00');
    setSelectedDays([]);
    setRepeatMode('daily');
  };

  const handleEmergencyStop = () => {
    Alert.alert(
      t('pumps.detail.emergencyStop'),
      t('pumps.detail.emergencyStopConfirm', { defaultValue: 'Are you sure you want to stop all pumps?' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('pumps.detail.stopAll', { defaultValue: 'Stop All' }),
          style: 'destructive',
          onPress: () => {
            if (FIREBASE_ENABLED) {
              dispatch(stopAllPumpsAsync());
            } else {
              dispatch(stopAllPumps());
            }
          },
        },
      ],
    );
  };

  const isRunning = pump.status === 'on';
  const nextSchedule = schedules
    .filter((s) => getScheduleStatus(s) === 'scheduled')
    .sort((a, b) => {
      const aTime = a.startTime?._seconds || new Date(a.startTime).getTime() / 1000;
      const bTime = b.startTime?._seconds || new Date(b.startTime).getTime() / 1000;
      return aTime - bTime;
    })[0];

  const clampInput = (text, max) => {
    const num = text.replace(/[^0-9]/g, '');
    if (num === '') return '';
    const val = Math.min(parseInt(num, 10), max);
    return String(val).padStart(2, '0');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{pump.name}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('pumps.irrigation.title')}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <MaterialCommunityIcons name="plus" size={18} color={COLORS.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primaryLight} style={{ marginVertical: SPACING.xxxl }} />
        ) : schedules.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No schedules yet</Text>
            <Text style={styles.emptySubtext}>Tap + Add to create a schedule</Text>
          </View>
        ) : (
          schedules.map((s) => {
            const status = getScheduleStatus(s);
            const startStr = formatScheduleTime(s.startTime);
            const stopStr = formatScheduleTime(s.stopTime);
            const daysCount = (s.days || []).length;
            return (
              <View key={s.id} style={styles.scheduleCard}>
                <View style={[styles.statusLine, { backgroundColor: getStatusColor(status) }]} />
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleName}>{s.repeat === 'daily' ? 'Daily' : `${daysCount} days/week`}</Text>
                  <Text style={styles.scheduleTime}>{startStr} - {stopStr}</Text>
                  <Text style={styles.scheduleDuration}>{s.repeat || 'once'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(status) }]}>{status}</Text>
                </View>
              </View>
            );
          })
        )}

        <Text style={styles.sectionTitle}>{t('pumps.irrigation.pumpStatus')}</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('common.status')}</Text>
            <Text style={[styles.statusVal, { color: isRunning ? COLORS.success : COLORS.textSecondary }]}>
              {isRunning ? t('common.running') : 'Off'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Total Schedules</Text>
            <Text style={styles.statusVal}>{schedules.length}</Text>
          </View>
          {nextSchedule && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>{t('pumps.irrigation.nextSchedule')}</Text>
              <Text style={styles.statusVal}>{formatScheduleTime(nextSchedule.startTime)}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Emergency Stop */}
      <TouchableOpacity style={[styles.emergencyBtn, { marginBottom: insets.bottom + 8 }]} onPress={handleEmergencyStop}>
        <MaterialCommunityIcons name="stop-circle" size={20} color={COLORS.white} />
        <Text style={styles.emergencyText}>{t('pumps.detail.emergencyStop')}</Text>
      </TouchableOpacity>

      {/* Add Schedule Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Schedule</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Start Time */}
            <Text style={styles.fieldLabel}>Start Time</Text>
            <View style={styles.timeInputRow}>
              <TextInput
                style={styles.timeInput}
                value={startHour}
                onChangeText={(v) => setStartHour(clampInput(v, 23))}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />
              <Text style={styles.timeColon}>:</Text>
              <TextInput
                style={styles.timeInput}
                value={startMin}
                onChangeText={(v) => setStartMin(clampInput(v, 59))}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />
            </View>

            {/* Stop Time */}
            <Text style={styles.fieldLabel}>Stop Time</Text>
            <View style={styles.timeInputRow}>
              <TextInput
                style={styles.timeInput}
                value={stopHour}
                onChangeText={(v) => setStopHour(clampInput(v, 23))}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />
              <Text style={styles.timeColon}>:</Text>
              <TextInput
                style={styles.timeInput}
                value={stopMin}
                onChangeText={(v) => setStopMin(clampInput(v, 59))}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />
            </View>

            {/* Repeat */}
            <Text style={styles.fieldLabel}>Repeat</Text>
            <View style={styles.repeatRow}>
              {['daily', 'once', 'custom'].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.repeatChip, repeatMode === mode && styles.repeatChipActive]}
                  onPress={() => setRepeatMode(mode)}
                >
                  <Text style={[styles.repeatChipText, repeatMode === mode && styles.repeatChipTextActive]}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Day selector for custom */}
            {repeatMode === 'custom' && (
              <View style={styles.daysRow}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayChip, selectedDays.includes(day) && styles.dayChipActive]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text style={[styles.dayChipText, selectedDays.includes(day) && styles.dayChipTextActive]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Save */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddSchedule}>
              <Text style={styles.saveBtnText}>Save Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, marginTop: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md, marginTop: SPACING.lg },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full },
  addBtnText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxxl },
  emptyText: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtext: { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, marginTop: SPACING.xs, textAlign: 'center' },
  scheduleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  statusLine: { width: 4, height: 48, borderRadius: 2, marginRight: SPACING.md },
  scheduleInfo: { flex: 1 },
  scheduleName: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  scheduleTime: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  scheduleDuration: { fontSize: FONT_SIZES.xs, color: COLORS.primaryLight, marginTop: 2 },
  statusBadge: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold, textTransform: 'capitalize' },
  statusCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statusLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  statusVal: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  emergencyBtn: { position: 'absolute', bottom: 0, left: SPACING.lg, right: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.danger, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, gap: SPACING.sm },
  emergencyText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xxl, paddingBottom: SPACING.xxxxl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  modalTitle: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  fieldLabel: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textSecondary, marginBottom: SPACING.sm, marginTop: SPACING.lg, textTransform: 'uppercase', letterSpacing: 0.5 },
  timeInputRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  timeInput: { width: 64, height: 56, borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, fontSize: 28, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary, textAlign: 'center' },
  timeColon: { fontSize: 28, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textSecondary },
  repeatRow: { flexDirection: 'row', gap: SPACING.sm },
  repeatChip: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border },
  repeatChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  repeatChipText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: FONT_WEIGHTS.medium },
  repeatChipTextActive: { color: COLORS.white },
  daysRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.md, flexWrap: 'wrap' },
  dayChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border },
  dayChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayChipText: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary },
  dayChipTextActive: { color: COLORS.white },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.xxl, ...SHADOWS.md },
  saveBtnText: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
});

export default PumpIrrigationScreen;
