import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { addAlertRule } from '../slice/devicesSlice';

const SENSOR_TYPES = [
  { key: 'soil_ph', icon: 'flask-outline', color: '#FF9800', label: 'Soil pH' },
  { key: 'soil_moisture', icon: 'water-percent', color: '#2196F3', label: 'Soil Moisture' },
  { key: 'temperature', icon: 'thermometer', color: '#F44336', label: 'Temperature' },
  { key: 'humidity', icon: 'water-outline', color: '#00BCD4', label: 'Humidity' },
  { key: 'water_level', icon: 'waves', color: '#1565C0', label: 'Water Level' },
];

const CONDITIONS = [
  { key: 'less_than', label: 'Less than', symbol: '<' },
  { key: 'greater_than', label: 'Greater than', symbol: '>' },
  { key: 'equals', label: 'Equals', symbol: '=' },
];

const NOTIFICATION_METHODS = [
  { key: 'app', icon: 'bell-outline', label: 'In-App', available: true },
  { key: 'sms', icon: 'message-text-outline', label: 'SMS', available: false },
  { key: 'whatsapp', icon: 'whatsapp', label: 'WhatsApp', available: false },
];

const AddAlertRuleScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [sensorType, setSensorType] = useState(null);
  const [condition, setCondition] = useState(null);
  const [threshold, setThreshold] = useState('');
  const [methods, setMethods] = useState(['app']);

  const toggleMethod = (key) => {
    const method = NOTIFICATION_METHODS.find((m) => m.key === key);
    if (!method.available) return;
    setMethods((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key],
    );
  };

  const handleSave = () => {
    if (!sensorType) {
      Alert.alert('Missing Field', 'Please select a sensor type.');
      return;
    }
    if (!condition) {
      Alert.alert('Missing Field', 'Please select a condition.');
      return;
    }
    if (!threshold || isNaN(Number(threshold))) {
      Alert.alert('Invalid Value', 'Please enter a valid numeric threshold.');
      return;
    }
    if (methods.length === 0) {
      Alert.alert('Missing Field', 'Please select at least one notification method.');
      return;
    }

    const rule = {
      id: Date.now().toString(),
      sensorType,
      condition,
      threshold: Number(threshold),
      methods,
      active: true,
      createdAt: new Date().toISOString(),
    };

    dispatch(addAlertRule(rule));
    navigation.goBack();
  };

  const selectedSensor = SENSOR_TYPES.find((s) => s.key === sensorType);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Alert Rule</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sensor Type */}
        <Text style={styles.sectionTitle}>Sensor Type</Text>
        <View style={styles.optionsGrid}>
          {SENSOR_TYPES.map((sensor) => {
            const isSelected = sensorType === sensor.key;
            return (
              <TouchableOpacity
                key={sensor.key}
                style={[
                  styles.optionCard,
                  isSelected && { borderColor: sensor.color, borderWidth: 2 },
                ]}
                onPress={() => setSensorType(sensor.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: sensor.color + '15' }]}>
                  <MaterialCommunityIcons name={sensor.icon} size={24} color={sensor.color} />
                </View>
                <Text style={[styles.optionLabel, isSelected && { color: sensor.color, fontWeight: FONT_WEIGHTS.semiBold }]}>
                  {sensor.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Condition */}
        <Text style={styles.sectionTitle}>Condition</Text>
        <View style={styles.conditionRow}>
          {CONDITIONS.map((cond) => {
            const isSelected = condition === cond.key;
            return (
              <TouchableOpacity
                key={cond.key}
                style={[styles.conditionCard, isSelected && styles.conditionCardActive]}
                onPress={() => setCondition(cond.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.conditionSymbol, isSelected && styles.conditionSymbolActive]}>
                  {cond.symbol}
                </Text>
                <Text style={[styles.conditionLabel, isSelected && styles.conditionLabelActive]}>
                  {cond.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Threshold */}
        <Text style={styles.sectionTitle}>Threshold Value</Text>
        <View style={styles.thresholdContainer}>
          {selectedSensor && (
            <View style={[styles.thresholdIcon, { backgroundColor: selectedSensor.color + '15' }]}>
              <MaterialCommunityIcons name={selectedSensor.icon} size={20} color={selectedSensor.color} />
            </View>
          )}
          <TextInput
            style={styles.thresholdInput}
            placeholder="Enter value"
            placeholderTextColor={COLORS.textTertiary}
            value={threshold}
            onChangeText={setThreshold}
            keyboardType="numeric"
          />
        </View>

        {/* Notification Methods */}
        <Text style={styles.sectionTitle}>Notification Method</Text>
        {NOTIFICATION_METHODS.map((method) => {
          const isSelected = methods.includes(method.key);
          return (
            <TouchableOpacity
              key={method.key}
              style={[styles.methodCard, !method.available && styles.methodCardDisabled]}
              onPress={() => toggleMethod(method.key)}
              activeOpacity={method.available ? 0.7 : 1}
            >
              <View style={styles.methodLeft}>
                <View style={[styles.checkbox, isSelected && method.available && styles.checkboxActive]}>
                  {isSelected && method.available && (
                    <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
                  )}
                </View>
                <MaterialCommunityIcons
                  name={method.icon}
                  size={22}
                  color={method.available ? COLORS.textPrimary : COLORS.textTertiary}
                />
                <Text style={[styles.methodLabel, !method.available && styles.methodLabelDisabled]}>
                  {method.label}
                </Text>
              </View>
              {!method.available && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="content-save-outline" size={20} color={COLORS.white} />
          <Text style={styles.saveButtonText}>Save Rule</Text>
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
    padding: SPACING.lg,
  },
  backBtn: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.xl,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  optionCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.sm,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  optionLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  conditionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  conditionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.sm,
  },
  conditionCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  conditionSymbol: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  conditionSymbolActive: {
    color: COLORS.white,
  },
  conditionLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  conditionLabelActive: {
    color: COLORS.white,
  },
  thresholdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    ...SHADOWS.sm,
  },
  thresholdIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  thresholdInput: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.md,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  methodCardDisabled: {
    opacity: 0.6,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  methodLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
  },
  methodLabelDisabled: {
    color: COLORS.textTertiary,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  comingSoonText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.xxl,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
});

export default AddAlertRuleScreen;
