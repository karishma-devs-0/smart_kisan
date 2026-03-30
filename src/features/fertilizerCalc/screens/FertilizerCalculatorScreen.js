import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import {
  CROP_NUTRIENT_FACTORS,
  FERTILIZER_PRICES,
  FERTILIZER_NUTRIENT_CONTENT,
  APPLICATION_SCHEDULE,
} from '../mock/fertilizerMockData';

const CROPS = [
  { key: 'rice', label: 'Rice', icon: 'grain' },
  { key: 'wheat', label: 'Wheat', icon: 'barley' },
  { key: 'maize', label: 'Maize', icon: 'corn' },
  { key: 'cotton', label: 'Cotton', icon: 'flower' },
  { key: 'sugarcane', label: 'Sugarcane', icon: 'grass' },
  { key: 'soybean', label: 'Soybean', icon: 'seed' },
  { key: 'tomato', label: 'Tomato', icon: 'food-apple' },
  { key: 'potato', label: 'Potato', icon: 'food' },
];

const FertilizerCalculatorScreen = ({ navigation }) => {
  const { t } = useTranslation();

  // Inputs
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [targetYield, setTargetYield] = useState('');
  const [fieldArea, setFieldArea] = useState('');
  const [soilN, setSoilN] = useState('');
  const [soilP, setSoilP] = useState('');
  const [soilK, setSoilK] = useState('');

  // Results
  const [results, setResults] = useState(null);

  const calculate = useCallback(() => {
    if (!selectedCrop) {
      Alert.alert('Select Crop', 'Please select a crop to calculate fertilizer needs.');
      return;
    }
    const yieldVal = parseFloat(targetYield);
    const areaVal = parseFloat(fieldArea);
    const nVal = parseFloat(soilN) || 0;
    const pVal = parseFloat(soilP) || 0;
    const kVal = parseFloat(soilK) || 0;

    if (!yieldVal || yieldVal <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid target yield.');
      return;
    }
    if (!areaVal || areaVal <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid field area.');
      return;
    }

    const factors = CROP_NUTRIENT_FACTORS[selectedCrop];
    const schedule = APPLICATION_SCHEDULE[selectedCrop];

    // Nutrient requirement per hectare (kg/ha)
    const nNeeded = Math.max(0, (yieldVal * factors.n) - nVal);
    const pNeeded = Math.max(0, (yieldVal * factors.p) - pVal);
    const kNeeded = Math.max(0, (yieldVal * factors.k) - kVal);

    // DAP provides both P and some N
    const dapKg = pNeeded / FERTILIZER_NUTRIENT_CONTENT.dap.p;
    const nFromDap = dapKg * FERTILIZER_NUTRIENT_CONTENT.dap.n;
    const remainingN = Math.max(0, nNeeded - nFromDap);
    const ureaKg = remainingN / FERTILIZER_NUTRIENT_CONTENT.urea.n;
    const mopKg = kNeeded / FERTILIZER_NUTRIENT_CONTENT.mop.k;

    // Total for the field
    const totalUrea = ureaKg * areaVal;
    const totalDAP = dapKg * areaVal;
    const totalMOP = mopKg * areaVal;

    // Cost calculation
    const ureaCost = (totalUrea / 50) * FERTILIZER_PRICES.urea;
    const dapCost = (totalDAP / 50) * FERTILIZER_PRICES.dap;
    const mopCost = (totalMOP / 50) * FERTILIZER_PRICES.mop;
    const totalCost = ureaCost + dapCost + mopCost;

    setResults({
      nNeeded: nNeeded.toFixed(1),
      pNeeded: pNeeded.toFixed(1),
      kNeeded: kNeeded.toFixed(1),
      ureaPerHa: ureaKg.toFixed(1),
      dapPerHa: dapKg.toFixed(1),
      mopPerHa: mopKg.toFixed(1),
      totalUrea: totalUrea.toFixed(1),
      totalDAP: totalDAP.toFixed(1),
      totalMOP: totalMOP.toFixed(1),
      ureaCost: Math.round(ureaCost),
      dapCost: Math.round(dapCost),
      mopCost: Math.round(mopCost),
      totalCost: Math.round(totalCost),
      schedule,
    });
  }, [selectedCrop, targetYield, fieldArea, soilN, soilP, soilK]);

  return (
    <ScreenLayout title="Fertilizer Calculator" showBack onBack={() => navigation.goBack()}>
      {/* Crop Picker */}
      <Text style={styles.label}>Select Crop</Text>
      <View style={styles.cropGrid}>
        {CROPS.map((crop) => {
          const isSelected = selectedCrop === crop.key;
          return (
            <TouchableOpacity
              key={crop.key}
              style={[styles.cropChip, isSelected && styles.cropChipSelected]}
              onPress={() => setSelectedCrop(crop.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={crop.icon}
                size={18}
                color={isSelected ? COLORS.white : COLORS.primary}
              />
              <Text style={[styles.cropChipText, isSelected && styles.cropChipTextSelected]}>
                {crop.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Target Yield */}
      <Text style={styles.label}>Target Yield (quintals/ha)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 40"
        placeholderTextColor={COLORS.textTertiary}
        keyboardType="decimal-pad"
        value={targetYield}
        onChangeText={setTargetYield}
      />

      {/* Field Area */}
      <Text style={styles.label}>Field Area (hectares)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 2.5"
        placeholderTextColor={COLORS.textTertiary}
        keyboardType="decimal-pad"
        value={fieldArea}
        onChangeText={setFieldArea}
      />

      {/* Soil Test Values */}
      <Text style={styles.label}>Soil Test Values (kg/ha)</Text>
      <View style={styles.soilRow}>
        <View style={styles.soilInputWrapper}>
          <Text style={styles.soilLabel}>N</Text>
          <TextInput
            style={styles.soilInput}
            placeholder="0"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            value={soilN}
            onChangeText={setSoilN}
          />
        </View>
        <View style={styles.soilInputWrapper}>
          <Text style={[styles.soilLabel, { color: COLORS.warning }]}>P</Text>
          <TextInput
            style={styles.soilInput}
            placeholder="0"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            value={soilP}
            onChangeText={setSoilP}
          />
        </View>
        <View style={styles.soilInputWrapper}>
          <Text style={[styles.soilLabel, { color: '#9C27B0' }]}>K</Text>
          <TextInput
            style={styles.soilInput}
            placeholder="0"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            value={soilK}
            onChangeText={setSoilK}
          />
        </View>
      </View>

      {/* Calculate Button */}
      <TouchableOpacity style={styles.calculateButton} onPress={calculate} activeOpacity={0.8}>
        <MaterialCommunityIcons name="calculator" size={20} color={COLORS.white} />
        <Text style={styles.calculateButtonText}>Calculate</Text>
      </TouchableOpacity>

      {/* Results */}
      {results && (
        <View style={styles.resultsContainer}>
          {/* NPK Requirement */}
          <Text style={styles.resultsSectionTitle}>NPK Requirement (kg/ha)</Text>
          <View style={styles.npkRow}>
            <View style={[styles.npkCard, { borderTopColor: COLORS.success }]}>
              <Text style={styles.npkLabel}>Nitrogen</Text>
              <Text style={[styles.npkValue, { color: COLORS.success }]}>{results.nNeeded}</Text>
              <Text style={styles.npkUnit}>kg/ha</Text>
            </View>
            <View style={[styles.npkCard, { borderTopColor: COLORS.warning }]}>
              <Text style={styles.npkLabel}>Phosphorus</Text>
              <Text style={[styles.npkValue, { color: COLORS.warning }]}>{results.pNeeded}</Text>
              <Text style={styles.npkUnit}>kg/ha</Text>
            </View>
            <View style={[styles.npkCard, { borderTopColor: '#9C27B0' }]}>
              <Text style={styles.npkLabel}>Potassium</Text>
              <Text style={[styles.npkValue, { color: '#9C27B0' }]}>{results.kNeeded}</Text>
              <Text style={styles.npkUnit}>kg/ha</Text>
            </View>
          </View>

          {/* Fertilizer Recommendation */}
          <Text style={styles.resultsSectionTitle}>Fertilizer Recommendation</Text>
          <View style={styles.fertilizerCard}>
            <FertilizerRow
              name="Urea"
              perHa={results.ureaPerHa}
              total={results.totalUrea}
              cost={results.ureaCost}
              color={COLORS.success}
            />
            <View style={styles.divider} />
            <FertilizerRow
              name="DAP"
              perHa={results.dapPerHa}
              total={results.totalDAP}
              cost={results.dapCost}
              color={COLORS.warning}
            />
            <View style={styles.divider} />
            <FertilizerRow
              name="MOP"
              perHa={results.mopPerHa}
              total={results.totalMOP}
              cost={results.mopCost}
              color="#9C27B0"
            />
          </View>

          {/* Application Schedule */}
          <Text style={styles.resultsSectionTitle}>Application Schedule</Text>
          <View style={styles.scheduleCard}>
            <ScheduleRow
              label="Basal Dose"
              percent={results.schedule.basal}
              icon="shovel"
            />
            <ScheduleRow
              label="1st Top Dressing"
              percent={results.schedule.firstTopDressing}
              icon="spray"
            />
            <ScheduleRow
              label="2nd Top Dressing"
              percent={results.schedule.secondTopDressing}
              icon="spray-bottle"
            />
          </View>

          {/* Total Cost */}
          <View style={styles.totalCostCard}>
            <View style={styles.totalCostHeader}>
              <MaterialCommunityIcons name="currency-inr" size={22} color={COLORS.primary} />
              <Text style={styles.totalCostLabel}>Total Estimated Cost</Text>
            </View>
            <Text style={styles.totalCostValue}>
              {'\u20B9'}{results.totalCost.toLocaleString('en-IN')}
            </Text>
            <View style={styles.costBreakdown}>
              <Text style={styles.costBreakdownItem}>Urea: {'\u20B9'}{results.ureaCost.toLocaleString('en-IN')}</Text>
              <Text style={styles.costBreakdownItem}>DAP: {'\u20B9'}{results.dapCost.toLocaleString('en-IN')}</Text>
              <Text style={styles.costBreakdownItem}>MOP: {'\u20B9'}{results.mopCost.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: SPACING.xxl }} />
    </ScreenLayout>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const FertilizerRow = ({ name, perHa, total, cost, color }) => (
  <View style={styles.fertilizerRow}>
    <View style={[styles.fertilizerDot, { backgroundColor: color }]} />
    <View style={styles.fertilizerInfo}>
      <Text style={styles.fertilizerName}>{name}</Text>
      <Text style={styles.fertilizerDetail}>{perHa} kg/ha | Total: {total} kg</Text>
    </View>
    <Text style={styles.fertilizerCost}>{'\u20B9'}{cost.toLocaleString('en-IN')}</Text>
  </View>
);

const ScheduleRow = ({ label, percent, icon }) => (
  <View style={styles.scheduleRow}>
    <View style={styles.scheduleIconContainer}>
      <MaterialCommunityIcons name={icon} size={18} color={COLORS.primary} />
    </View>
    <Text style={styles.scheduleLabel}>{label}</Text>
    <View style={styles.scheduleBarBg}>
      <View style={[styles.scheduleBarFill, { width: `${percent}%` }]} />
    </View>
    <Text style={styles.schedulePercent}>{percent}%</Text>
  </View>
);

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Labels & Inputs
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Crop Picker
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primarySurface,
  },
  cropChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cropChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primary,
  },
  cropChipTextSelected: {
    color: COLORS.white,
  },

  // Soil Inputs
  soilRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  soilInputWrapper: {
    flex: 1,
  },
  soilLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.success,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  soilInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'center',
  },

  // Calculate Button
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.xxl,
    ...SHADOWS.sm,
  },
  calculateButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },

  // Results Container
  resultsContainer: {
    marginTop: SPACING.xxl,
  },
  resultsSectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },

  // NPK Cards
  npkRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  npkCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderTopWidth: 3,
    ...SHADOWS.sm,
  },
  npkLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  npkValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  npkUnit: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },

  // Fertilizer Card
  fertilizerCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  fertilizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  fertilizerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  fertilizerInfo: {
    flex: 1,
  },
  fertilizerName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  fertilizerDetail: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  fertilizerCost: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.xs,
  },

  // Schedule
  scheduleCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scheduleIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleLabel: {
    width: 110,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  scheduleBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.divider,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scheduleBarFill: {
    height: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  schedulePercent: {
    width: 36,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
    textAlign: 'right',
  },

  // Total Cost
  totalCostCard: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginTop: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  totalCostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  totalCostLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  totalCostValue: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryDark,
    marginBottom: SPACING.md,
  },
  costBreakdown: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  costBreakdownItem: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});

export default FertilizerCalculatorScreen;
