import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { useTranslation } from 'react-i18next';
import { BORDER_RADIUS } from '../../../constants/layout';
import { saveSensorConfig } from '../slice/pumpsSlice';
import { sendSensorConfig } from '../../../services/mqtt';

const SoilMoistureControlScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { pumpId } = route.params || {};
  const pump = useSelector((s) => s.pumps.pumps.find((p) => p.id === pumpId)) || {
    name: 'Pump',
    soilMoisture: 45,
    waterLevel: 78,
    sensorConfig: {},
  };

  const cfg = pump.sensorConfig || {};
  const [moistureLow, setMoistureLow] = useState(cfg.moistureLow || 30);
  const [moistureHigh, setMoistureHigh] = useState(cfg.moistureHigh || 60);
  const [waterLevelMin, setWaterLevelMin] = useState(cfg.waterLevelMin || 20);

  const currentMoisture = pump.soilMoisture || 45;
  const currentWaterLevel = pump.waterLevel || 78;

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  const adjustValue = (setter, current, delta, min, max) => {
    const next = current + delta;
    if (next >= min && next <= max) setter(next);
  };

  const handleFieldPress = (field) => {
    const current = field === 'moistureLow' ? moistureLow : field === 'moistureHigh' ? moistureHigh : waterLevelMin;
    setEditingField(field);
    setEditValue(String(current));
  };

  const handleFieldSubmit = () => {
    const val = parseInt(editValue, 10) || 0;
    if (editingField === 'moistureLow') setMoistureLow(Math.min(moistureHigh - 5, Math.max(5, val)));
    else if (editingField === 'moistureHigh') setMoistureHigh(Math.min(95, Math.max(moistureLow + 5, val)));
    else if (editingField === 'waterLevelMin') setWaterLevelMin(Math.min(50, Math.max(5, val)));
    setEditingField(null);
    setEditValue('');
  };

  const handleSave = () => {
    const config = {
      ...cfg,
      moistureLow,
      moistureHigh,
      waterLevelMin,
    };
    dispatch(saveSensorConfig({ pumpId, sensorConfig: config }));
    sendSensorConfig(pumpId, config);
    Alert.alert(t('common.saved', { defaultValue: 'Saved' }), t('sensorBased.thresholdsUpdated', { defaultValue: 'Sensor thresholds updated.' }));
    navigation.goBack();
  };

  const getMoistureStatus = () => {
    if (currentMoisture < moistureLow) return { label: 'Low — Pump should be ON', color: COLORS.danger };
    if (currentMoisture > moistureHigh) return { label: 'High — Pump should be OFF', color: COLORS.info };
    return { label: 'Optimal', color: COLORS.success };
  };

  const status = getMoistureStatus();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('sensorBased.sensorThresholds', { defaultValue: 'Sensor Thresholds' })}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Moisture */}
        <View style={styles.gaugeCard}>
          <Text style={styles.cardTitle}>{t('sensorBased.currentSoilMoisture', { defaultValue: 'Current Soil Moisture' })}</Text>
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeOuter}>
              <View style={[styles.gaugeInner, { borderColor: status.color }]}>
                <Text style={[styles.gaugeValue, { color: status.color }]}>{currentMoisture}%</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Moisture Low Threshold */}
        <View style={styles.thresholdCard}>
          <View style={styles.thresholdHeader}>
            <MaterialCommunityIcons name="arrow-down-bold" size={20} color={COLORS.danger} />
            <Text style={styles.thresholdTitle}>{t('sensorBased.turnOnBelow', { defaultValue: 'Turn ON Below' })}</Text>
          </View>
          <Text style={styles.thresholdDesc}>{t('sensorBased.turnOnBelowDesc', { defaultValue: 'Pump will start when moisture drops below this level' })}</Text>
          <View style={styles.adjusterRow}>
            <TouchableOpacity
              style={styles.adjusterBtn}
              onPress={() => adjustValue(setMoistureLow, moistureLow, -5, 5, moistureHigh - 5)}
            >
              <MaterialCommunityIcons name="minus" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.adjusterValue, editingField === 'moistureLow' && styles.adjusterEditing]} onPress={() => handleFieldPress('moistureLow')}>
              {editingField === 'moistureLow' ? (
                <TextInput style={styles.adjusterInput} value={editValue} onChangeText={setEditValue} onBlur={handleFieldSubmit} onSubmitEditing={handleFieldSubmit} keyboardType="number-pad" maxLength={2} autoFocus selectTextOnFocus />
              ) : (
                <Text style={styles.adjusterNum}>{moistureLow}%</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adjusterBtn}
              onPress={() => adjustValue(setMoistureLow, moistureLow, 5, 5, moistureHigh - 5)}
            >
              <MaterialCommunityIcons name="plus" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Moisture High Threshold */}
        <View style={styles.thresholdCard}>
          <View style={styles.thresholdHeader}>
            <MaterialCommunityIcons name="arrow-up-bold" size={20} color={COLORS.info} />
            <Text style={styles.thresholdTitle}>{t('sensorBased.turnOffAbove', { defaultValue: 'Turn OFF Above' })}</Text>
          </View>
          <Text style={styles.thresholdDesc}>{t('sensorBased.turnOffAboveDesc', { defaultValue: 'Pump will stop when moisture reaches this level' })}</Text>
          <View style={styles.adjusterRow}>
            <TouchableOpacity
              style={styles.adjusterBtn}
              onPress={() => adjustValue(setMoistureHigh, moistureHigh, -5, moistureLow + 5, 95)}
            >
              <MaterialCommunityIcons name="minus" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.adjusterValue, editingField === 'moistureHigh' && styles.adjusterEditing]} onPress={() => handleFieldPress('moistureHigh')}>
              {editingField === 'moistureHigh' ? (
                <TextInput style={styles.adjusterInput} value={editValue} onChangeText={setEditValue} onBlur={handleFieldSubmit} onSubmitEditing={handleFieldSubmit} keyboardType="number-pad" maxLength={2} autoFocus selectTextOnFocus />
              ) : (
                <Text style={styles.adjusterNum}>{moistureHigh}%</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adjusterBtn}
              onPress={() => adjustValue(setMoistureHigh, moistureHigh, 5, moistureLow + 5, 95)}
            >
              <MaterialCommunityIcons name="plus" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Water Level Minimum */}
        <View style={styles.thresholdCard}>
          <View style={styles.thresholdHeader}>
            <MaterialCommunityIcons name="water-alert" size={20} color="#FF9800" />
            <Text style={styles.thresholdTitle}>{t('sensorBased.minWaterLevel', { defaultValue: 'Min Water Level' })}</Text>
          </View>
          <Text style={styles.thresholdDesc}>{t('sensorBased.minWaterLevelDesc', { defaultValue: 'Stop pump if water source drops below this level' })} ({currentWaterLevel}%)</Text>
          <View style={styles.adjusterRow}>
            <TouchableOpacity
              style={styles.adjusterBtn}
              onPress={() => adjustValue(setWaterLevelMin, waterLevelMin, -5, 5, 50)}
            >
              <MaterialCommunityIcons name="minus" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.adjusterValue, editingField === 'waterLevelMin' && styles.adjusterEditing]} onPress={() => handleFieldPress('waterLevelMin')}>
              {editingField === 'waterLevelMin' ? (
                <TextInput style={styles.adjusterInput} value={editValue} onChangeText={setEditValue} onBlur={handleFieldSubmit} onSubmitEditing={handleFieldSubmit} keyboardType="number-pad" maxLength={2} autoFocus selectTextOnFocus />
              ) : (
                <Text style={styles.adjusterNum}>{waterLevelMin}%</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adjusterBtn}
              onPress={() => adjustValue(setWaterLevelMin, waterLevelMin, 5, 5, 50)}
            >
              <MaterialCommunityIcons name="plus" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <MaterialCommunityIcons name="content-save" size={20} color={COLORS.white} />
          <Text style={styles.saveButtonText}>{t('sensorBased.saveThresholds', { defaultValue: 'Save Thresholds' })}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  title: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  content: { padding: SPACING.lg, paddingBottom: 100 },

  gaugeCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg },
  cardTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, alignSelf: 'flex-start', marginBottom: SPACING.lg },
  gaugeContainer: { marginBottom: SPACING.lg },
  gaugeOuter: { width: 140, height: 140, borderRadius: 70, borderWidth: 8, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  gaugeInner: { width: 110, height: 110, borderRadius: 55, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  gaugeValue: { fontSize: 32, fontWeight: FONT_WEIGHTS.bold },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, gap: SPACING.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold },

  thresholdCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, marginBottom: SPACING.md },
  thresholdHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  thresholdTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  thresholdDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  adjusterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xl },
  adjusterBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  adjusterValue: { minWidth: 80, alignItems: 'center' },
  adjusterNum: { fontSize: 32, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  adjusterEditing: { borderWidth: 2, borderColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm },
  adjusterInput: { fontSize: 32, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary, textAlign: 'center', padding: 0, minWidth: 60 },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  saveButtonText: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
});

export default SoilMoistureControlScreen;
