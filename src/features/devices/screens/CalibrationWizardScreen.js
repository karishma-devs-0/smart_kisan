import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { saveCalibration } from '../slice/devicesSlice';

const SENSOR_TYPES = [
  {
    key: 'ph',
    label: 'pH Sensor',
    icon: 'flask-outline',
    color: '#FF9800',
    instruction: 'Place sensor in pH 7.0 buffer solution',
    defaultReference: '7.0',
    unit: 'pH',
    simulatedReading: 6.82,
  },
  {
    key: 'moisture',
    label: 'Moisture Sensor',
    icon: 'water-percent',
    color: '#2196F3',
    instruction: 'Place sensor in dry soil (0% moisture)',
    defaultReference: '0',
    unit: '%',
    simulatedReading: 3.4,
  },
  {
    key: 'temperature',
    label: 'Temperature Sensor',
    icon: 'thermometer',
    color: '#F44336',
    instruction: 'Place sensor in room temperature water (25\u00B0C)',
    defaultReference: '25',
    unit: '\u00B0C',
    simulatedReading: 24.6,
  },
  {
    key: 'ec',
    label: 'EC Sensor',
    icon: 'flash-outline',
    color: '#9C27B0',
    instruction: 'Place sensor in 1413 \u00B5S/cm calibration solution',
    defaultReference: '1413',
    unit: '\u00B5S/cm',
    simulatedReading: 1389,
  },
];

const STEPS = ['Select Sensor', 'Prepare', 'Reference', 'Confirm'];

// ─── Progress Indicator ──────────────────────────────────────────────────────

const ProgressIndicator = ({ currentStep }) => (
  <View style={styles.progressContainer}>
    {STEPS.map((label, index) => {
      const isCompleted = index < currentStep;
      const isActive = index === currentStep;
      return (
        <React.Fragment key={label}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                isCompleted && styles.stepCircleCompleted,
                isActive && styles.stepCircleActive,
              ]}
            >
              {isCompleted ? (
                <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    (isActive || isCompleted) && styles.stepNumberActive,
                  ]}
                >
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                isActive && styles.stepLabelActive,
                isCompleted && styles.stepLabelCompleted,
              ]}
            >
              {label}
            </Text>
          </View>
          {index < STEPS.length - 1 && (
            <View
              style={[
                styles.stepLine,
                isCompleted && styles.stepLineCompleted,
              ]}
            />
          )}
        </React.Fragment>
      );
    })}
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

const CalibrationWizardScreen = ({ navigation, route }) => {
  const { deviceId } = route.params || {};
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [referenceValue, setReferenceValue] = useState('');
  const [saved, setSaved] = useState(false);

  const sensorData = useMemo(
    () => SENSOR_TYPES.find((s) => s.key === selectedSensor),
    [selectedSensor],
  );

  const currentReading = sensorData?.simulatedReading ?? 0;
  const offset = referenceValue !== '' ? parseFloat(referenceValue) - currentReading : 0;

  // ── Navigation helpers ───────────────────────────────────────────────────

  const canGoNext = () => {
    if (currentStep === 0) return selectedSensor !== null;
    if (currentStep === 2) return referenceValue !== '' && !isNaN(parseFloat(referenceValue));
    return true;
  };

  const handleNext = () => {
    if (currentStep < 3) {
      if (currentStep === 0 && sensorData) {
        setReferenceValue(sensorData.defaultReference);
      }
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSave = () => {
    dispatch(
      saveCalibration({
        deviceId,
        sensorType: selectedSensor,
        referenceValue: parseFloat(referenceValue),
        currentReading,
        offset: parseFloat(offset.toFixed(4)),
        date: new Date().toISOString(),
      }),
    );
    setSaved(true);
  };

  // ── Step renderers ───────────────────────────────────────────────────────

  const renderStep0 = () => (
    <View>
      <Text style={styles.sectionTitle}>Select Sensor Type</Text>
      <Text style={styles.sectionSubtitle}>
        Choose the sensor you want to calibrate
      </Text>
      <View style={styles.sensorGrid}>
        {SENSOR_TYPES.map((sensor) => {
          const isSelected = selectedSensor === sensor.key;
          return (
            <TouchableOpacity
              key={sensor.key}
              style={[
                styles.sensorCard,
                isSelected && { borderColor: sensor.color, borderWidth: 2 },
              ]}
              onPress={() => setSelectedSensor(sensor.key)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.sensorIconContainer,
                  { backgroundColor: sensor.color + '15' },
                ]}
              >
                <MaterialCommunityIcons
                  name={sensor.icon}
                  size={28}
                  color={sensor.color}
                />
              </View>
              <Text style={styles.sensorLabel}>{sensor.label}</Text>
              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: sensor.color }]}>
                  <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View>
      <Text style={styles.sectionTitle}>Prepare Reference</Text>
      <Text style={styles.sectionSubtitle}>
        Follow the instructions below before proceeding
      </Text>
      <View style={styles.instructionCard}>
        <View
          style={[
            styles.instructionIconContainer,
            { backgroundColor: (sensorData?.color || COLORS.primary) + '15' },
          ]}
        >
          <MaterialCommunityIcons
            name={sensorData?.icon || 'alert'}
            size={36}
            color={sensorData?.color || COLORS.primary}
          />
        </View>
        <Text style={styles.instructionSensorName}>{sensorData?.label}</Text>
        <View style={styles.instructionDivider} />
        <View style={styles.instructionRow}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={COLORS.info}
          />
          <Text style={styles.instructionText}>{sensorData?.instruction}</Text>
        </View>
        <View style={styles.instructionRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={20}
            color={COLORS.warning}
          />
          <Text style={styles.instructionText}>
            Wait 30 seconds for the reading to stabilize
          </Text>
        </View>
        <View style={styles.instructionRow}>
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={20}
            color={COLORS.success}
          />
          <Text style={styles.instructionText}>
            Ensure the sensor is fully submerged / in contact
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.sectionTitle}>Enter Reference Value</Text>
      <Text style={styles.sectionSubtitle}>
        Compare the current reading with the known reference
      </Text>

      <View style={styles.readingCard}>
        <Text style={styles.readingLabel}>Current Reading</Text>
        <Text style={[styles.readingValue, { color: sensorData?.color || COLORS.primary }]}>
          {currentReading}
          <Text style={styles.readingUnit}> {sensorData?.unit}</Text>
        </Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Known Reference Value</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={referenceValue}
            onChangeText={setReferenceValue}
            keyboardType="decimal-pad"
            placeholder={`e.g. ${sensorData?.defaultReference}`}
            placeholderTextColor={COLORS.textTertiary}
          />
          <Text style={styles.inputUnit}>{sensorData?.unit}</Text>
        </View>
      </View>

      {referenceValue !== '' && !isNaN(parseFloat(referenceValue)) && (
        <View style={styles.offsetCard}>
          <MaterialCommunityIcons
            name="swap-vertical"
            size={22}
            color={COLORS.info}
          />
          <View style={styles.offsetContent}>
            <Text style={styles.offsetLabel}>Calculated Offset</Text>
            <Text style={styles.offsetValue}>
              {offset >= 0 ? '+' : ''}
              {offset.toFixed(4)} {sensorData?.unit}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderStep3 = () => {
    if (saved) {
      return (
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <MaterialCommunityIcons name="check-circle" size={72} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Calibration Saved!</Text>
          <Text style={styles.successSubtitle}>
            Your {sensorData?.label} has been calibrated successfully.
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const summaryItems = [
      { label: 'Sensor Type', value: sensorData?.label, icon: sensorData?.icon, color: sensorData?.color },
      { label: 'Reference Value', value: `${referenceValue} ${sensorData?.unit}`, icon: 'target', color: COLORS.info },
      { label: 'Current Reading', value: `${currentReading} ${sensorData?.unit}`, icon: 'gauge', color: COLORS.warning },
      {
        label: 'Calculated Offset',
        value: `${offset >= 0 ? '+' : ''}${offset.toFixed(4)} ${sensorData?.unit}`,
        icon: 'swap-vertical',
        color: COLORS.primary,
      },
    ];

    return (
      <View>
        <Text style={styles.sectionTitle}>Confirm & Save</Text>
        <Text style={styles.sectionSubtitle}>
          Review the calibration details below
        </Text>
        {summaryItems.map((item) => (
          <View key={item.label} style={styles.summaryRow}>
            <View style={[styles.summaryIconContainer, { backgroundColor: (item.color || COLORS.primary) + '15' }]}>
              <MaterialCommunityIcons
                name={item.icon || 'information'}
                size={20}
                color={item.color || COLORS.primary}
              />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calibration Wizard</Text>
      </View>

      {/* Progress */}
      <ProgressIndicator currentStep={currentStep} />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {stepRenderers[currentStep]()}
      </ScrollView>

      {/* Bottom Buttons */}
      {!saved && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.md }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color={COLORS.textPrimary} />
            <Text style={styles.backButtonText}>
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </Text>
          </TouchableOpacity>

          {currentStep < 3 ? (
            <TouchableOpacity
              style={[styles.nextButton, !canGoNext() && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!canGoNext()}
              activeOpacity={0.7}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="check" size={18} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Save Calibration</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

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

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.success,
  },
  stepNumber: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textTertiary,
  },
  stepNumberActive: {
    color: COLORS.white,
  },
  stepLabel: {
    fontSize: 9,
    color: COLORS.textTertiary,
    marginTop: 3,
    fontWeight: FONT_WEIGHTS.medium,
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  stepLabelCompleted: {
    color: COLORS.success,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  stepLineCompleted: {
    backgroundColor: COLORS.success,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },

  // Section
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },

  // Step 0 — Sensor Cards
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  sensorCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  sensorIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  sensorLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Step 1 — Instructions
  instructionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  instructionIconContainer: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  instructionSensorName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  instructionDivider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: SPACING.lg,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  instructionText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },

  // Step 2 — Reference
  readingCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  readingLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  readingValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  readingUnit: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
  },
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  inputUnit: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    paddingRight: SPACING.lg,
  },
  offsetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '10',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  offsetContent: {
    flex: 1,
  },
  offsetLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  offsetValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.info,
    marginTop: 2,
  },

  // Step 3 — Summary
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },

  // Success
  successContainer: {
    alignItems: 'center',
    paddingTop: SPACING.xxxxl,
  },
  successIconContainer: {
    marginBottom: SPACING.xxl,
  },
  successTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  successSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.xxl,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxxxl,
    ...SHADOWS.md,
  },
  doneButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  nextButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
});

export default CalibrationWizardScreen;
