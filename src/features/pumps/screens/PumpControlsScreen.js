import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { useTranslation } from 'react-i18next';
import { BORDER_RADIUS } from '../../../constants/layout';
import { controlPump, togglePump, stopAllPumpsAsync, stopAllPumps } from '../slice/pumpsSlice';
import { FIREBASE_ENABLED } from '../../../services/firebase';
import { sendPumpCommand } from '../../../services/mqtt';

const PumpControlsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { pumpId } = route.params || {};
  const pump = useSelector((s) => s.pumps.pumps.find((p) => p.id === pumpId)) || { name: 'Pump', status: 'off', mode: 'manual' };

  const isOn = pump.status === 'on';

  const handleToggle = () => {
    const newAction = isOn ? 'off' : 'on';
    sendPumpCommand(pumpId, newAction);
    if (FIREBASE_ENABLED) {
      dispatch(controlPump({ pumpId, action: newAction }));
    } else {
      dispatch(togglePump(pumpId));
    }
  };

  const handleEmergencyStop = () => {
    Alert.alert(
      t('pumpControls.emergencyStop'),
      t('pumps.detail.emergencyStopConfirm', { defaultValue: 'Are you sure you want to stop all pumps?' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('pumps.detail.stopAll', { defaultValue: 'Stop All' }),
          style: 'destructive',
          onPress: () => {
            sendPumpCommand(pumpId, 'off');
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

  const formatLastRun = (dateStr) => {
    if (!dateStr) return t('common.never', { defaultValue: 'Never' });
    const d = new Date(dateStr);
    const diffH = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60));
    if (diffH < 1) return t('common.justNow', { defaultValue: 'Just now' });
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.round(diffH / 24)}d ago`;
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
        <Text style={styles.sectionTitle}>{t('pumpControls.title')}</Text>

        {/* Power Toggle */}
        <View style={styles.controlCard}>
          <View style={styles.controlRow}>
            <MaterialCommunityIcons name="power" size={24} color={isOn ? COLORS.primaryLight : COLORS.textSecondary} />
            <View style={styles.controlInfo}>
              <Text style={styles.controlName}>{t('pumpControls.powerControl', { defaultValue: 'Power' })}</Text>
              <Text style={styles.controlDesc}>
                {isOn ? t('common.running') : t('common.off', { defaultValue: 'Off' })}
              </Text>
            </View>
            <TouchableOpacity style={[styles.toggle, isOn && styles.toggleOn]} onPress={handleToggle}>
              <View style={[styles.toggleThumb, isOn && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pump Details */}
        <Text style={styles.sectionTitle}>{t('pumpControls.pumpDetails', { defaultValue: 'Pump Details' })}</Text>
        <View style={styles.controlCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('pumpControls.mode', { defaultValue: 'Mode' })}</Text>
            <Text style={styles.settingValue}>{(pump.mode || 'manual').charAt(0).toUpperCase() + (pump.mode || 'manual').slice(1)}</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('pumpControls.type', { defaultValue: 'Type' })}</Text>
            <Text style={styles.settingValue}>{(pump.type || 'submersible').charAt(0).toUpperCase() + (pump.type || 'submersible').slice(1)}</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('pumpControls.power', { defaultValue: 'Power' })}</Text>
            <Text style={styles.settingValue}>{pump.hp || '--'} HP</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('pumpControls.field', { defaultValue: 'Field' })}</Text>
            <Text style={styles.settingValue}>{pump.field || t('pumps.noFieldAssigned', 'Not assigned')}</Text>
          </View>
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.settingLabel}>{t('pumpControls.lastRun', { defaultValue: 'Last Run' })}</Text>
            <Text style={styles.settingValue}>{formatLastRun(pump.lastRun || pump.lastTurnedOn)}</Text>
          </View>
        </View>

        {/* Sensor Readings (if available) */}
        {(pump.soilMoisture != null || pump.waterLevel != null) && (
          <>
            <Text style={styles.sectionTitle}>{t('pumpControls.sensorReadings', { defaultValue: 'Sensor Readings' })}</Text>
            <View style={styles.controlCard}>
              {pump.soilMoisture != null && (
                <View style={styles.flowRow}>
                  <MaterialCommunityIcons name="water-percent" size={24} color={COLORS.info} />
                  <View style={{ flex: 1, marginLeft: SPACING.md }}>
                    <Text style={styles.settingLabel}>{t('pumpControls.soilMoisture', { defaultValue: 'Soil Moisture' })}</Text>
                    <Text style={styles.flowValue}>{pump.soilMoisture}%</Text>
                  </View>
                </View>
              )}
              {pump.waterLevel != null && (
                <View style={[styles.flowRow, { marginTop: SPACING.md }]}>
                  <MaterialCommunityIcons name="waves" size={24} color="#2196F3" />
                  <View style={{ flex: 1, marginLeft: SPACING.md }}>
                    <Text style={styles.settingLabel}>{t('pumpControls.waterLevel', { defaultValue: 'Water Level' })}</Text>
                    <Text style={styles.flowValue}>{pump.waterLevel}%</Text>
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <TouchableOpacity style={[styles.emergencyBtn, { marginBottom: insets.bottom + 8 }]} onPress={handleEmergencyStop}>
        <MaterialCommunityIcons name="stop-circle" size={20} color={COLORS.white} />
        <Text style={styles.emergencyText}>{t('pumpControls.emergencyStop')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md, marginTop: SPACING.lg },
  controlCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  controlRow: { flexDirection: 'row', alignItems: 'center' },
  controlInfo: { flex: 1, marginLeft: SPACING.md },
  controlName: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  controlDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: COLORS.background, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: COLORS.primaryLight },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.textSecondary },
  toggleThumbOn: { alignSelf: 'flex-end', backgroundColor: COLORS.white },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  settingValue: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.textPrimary },
  flowRow: { flexDirection: 'row', alignItems: 'center' },
  flowValue: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.info },
  emergencyBtn: { position: 'absolute', bottom: 0, left: SPACING.lg, right: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.danger, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, gap: SPACING.sm },
  emergencyText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
});

export default PumpControlsScreen;
