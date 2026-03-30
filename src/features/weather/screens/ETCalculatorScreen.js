import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';

const CROP_COEFFICIENTS = [
  { name: 'Default', kc: 1.0, icon: 'sprout' },
  { name: 'Rice', kc: 1.2, icon: 'rice' },
  { name: 'Wheat', kc: 1.15, icon: 'barley' },
  { name: 'Maize', kc: 1.2, icon: 'corn' },
  { name: 'Cotton', kc: 1.15, icon: 'flower-outline' },
  { name: 'Sugarcane', kc: 1.25, icon: 'grass' },
  { name: 'Tomato', kc: 1.05, icon: 'food-apple-outline' },
  { name: 'Potato', kc: 1.1, icon: 'food-variant' },
];

// Extraterrestrial radiation for India (~15 MJ/m2/day average)
const DEFAULT_RA = 15;

const calculateET0 = (tMax, tMin, ra) => {
  const tMean = (tMax + tMin) / 2;
  const tDiff = tMax - tMin;
  if (tDiff <= 0) return 0;
  return 0.0023 * (tMean + 17.8) * Math.pow(tDiff, 0.5) * ra;
};

const InputField = ({ label, value, onChangeText, unit, icon }) => (
  <View style={styles.inputRow}>
    <View style={styles.inputLabelRow}>
      <MaterialCommunityIcons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.inputLabel}>{label}</Text>
    </View>
    <View style={styles.inputWrapper}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={COLORS.textTertiary}
      />
      <Text style={styles.unitText}>{unit}</Text>
    </View>
  </View>
);

const ETCalculatorScreen = ({ navigation }) => {
  const current = useSelector((s) => s.weather.current);

  const [tMax, setTMax] = useState(current?.temp ? String(current.temp) : '39');
  const [tMin, setTMin] = useState(current?.temp ? String(current.temp - 12) : '27');
  const [humidity, setHumidity] = useState(current?.humidity ? String(current.humidity) : '71');
  const [windSpeed, setWindSpeed] = useState(current?.windSpeed ? String(current.windSpeed) : '11');
  const [solarRadiation, setSolarRadiation] = useState(String(DEFAULT_RA));
  const [elevation, setElevation] = useState('300');
  const [selectedCrop, setSelectedCrop] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const result = useMemo(() => {
    const tMaxNum = parseFloat(tMax) || 0;
    const tMinNum = parseFloat(tMin) || 0;
    const ra = parseFloat(solarRadiation) || DEFAULT_RA;

    const et0 = calculateET0(tMaxNum, tMinNum, ra);
    const kc = CROP_COEFFICIENTS[selectedCrop].kc;
    const cropWaterNeed = et0 * kc;
    const weeklyWaterLitersPerHa = cropWaterNeed * 7 * 10000; // mm/day * 7 days * 10000 m2/ha = liters/ha/week

    return {
      et0: et0.toFixed(2),
      cropWaterNeed: cropWaterNeed.toFixed(2),
      weeklyWaterLitersPerHa: Math.round(weeklyWaterLitersPerHa).toLocaleString(),
      kc,
      cropName: CROP_COEFFICIENTS[selectedCrop].name,
    };
  }, [tMax, tMin, solarRadiation, selectedCrop]);

  const getIrrigationRecommendation = () => {
    const et0 = parseFloat(result.et0);
    if (et0 < 3) return { text: 'Low water demand. Irrigation can be reduced.', color: COLORS.success, icon: 'water-check' };
    if (et0 < 5) return { text: 'Moderate water demand. Maintain regular irrigation schedule.', color: COLORS.info, icon: 'water' };
    if (et0 < 7) return { text: 'High water demand. Increase irrigation frequency.', color: COLORS.warning, icon: 'water-alert' };
    return { text: 'Very high water demand. Irrigate frequently and consider mulching.', color: COLORS.danger, icon: 'water-alert' };
  };

  return (
    <ScreenLayout
      prefix="ET"
      title="Calculator"
      showBack
      onBack={() => navigation.goBack()}
      scrollable={true}
    >
      {/* Info Card */}
      <View style={styles.infoCard}>
        <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.info} />
        <Text style={styles.infoText}>
          Calculates reference evapotranspiration (ET0) using the Hargreaves method to estimate crop water requirements.
        </Text>
      </View>

      {/* Input Fields */}
      <Text style={styles.sectionTitle}>Weather Parameters</Text>
      <View style={styles.inputCard}>
        <InputField label="Max Temperature" value={tMax} onChangeText={setTMax} unit="°C" icon="thermometer-high" />
        <InputField label="Min Temperature" value={tMin} onChangeText={setTMin} unit="°C" icon="thermometer-low" />
        <InputField label="Humidity" value={humidity} onChangeText={setHumidity} unit="%" icon="water-percent" />
        <InputField label="Wind Speed" value={windSpeed} onChangeText={setWindSpeed} unit="m/s" icon="weather-windy" />
        <InputField label="Solar Radiation (Ra)" value={solarRadiation} onChangeText={setSolarRadiation} unit="MJ/m²/day" icon="white-balance-sunny" />
        <InputField label="Elevation" value={elevation} onChangeText={setElevation} unit="m" icon="image-filter-hdr" />
      </View>

      {/* Crop Coefficient Selector */}
      <Text style={styles.sectionTitle}>Crop Coefficient (Kc)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropScroll}>
        {CROP_COEFFICIENTS.map((crop, i) => (
          <TouchableOpacity
            key={crop.name}
            style={[styles.cropChip, selectedCrop === i && styles.cropChipActive]}
            onPress={() => setSelectedCrop(i)}
          >
            <MaterialCommunityIcons
              name={crop.icon}
              size={18}
              color={selectedCrop === i ? COLORS.white : COLORS.primary}
            />
            <Text style={[styles.cropChipText, selectedCrop === i && styles.cropChipTextActive]}>
              {crop.name}
            </Text>
            <Text style={[styles.cropKcText, selectedCrop === i && styles.cropChipTextActive]}>
              Kc: {crop.kc}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Calculate Button */}
      <TouchableOpacity style={styles.calculateButton} onPress={() => setShowResult(true)}>
        <MaterialCommunityIcons name="calculator" size={22} color={COLORS.white} />
        <Text style={styles.calculateText}>Calculate ET0</Text>
      </TouchableOpacity>

      {/* Results */}
      {showResult && (
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Results</Text>

          {/* ET0 Result Card */}
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons name="water-outline" size={28} color={COLORS.primary} />
              <View style={styles.resultHeaderText}>
                <Text style={styles.resultLabel}>Reference ET0</Text>
                <Text style={styles.resultValue}>{result.et0} mm/day</Text>
              </View>
            </View>
          </View>

          {/* Crop Water Need Card */}
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons name="sprout" size={28} color={COLORS.success} />
              <View style={styles.resultHeaderText}>
                <Text style={styles.resultLabel}>Crop Water Need ({result.cropName})</Text>
                <Text style={styles.resultValue}>{result.cropWaterNeed} mm/day</Text>
              </View>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultRow}>
              <Text style={styles.resultSubLabel}>Kc coefficient</Text>
              <Text style={styles.resultSubValue}>{result.kc}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultSubLabel}>Formula</Text>
              <Text style={styles.resultSubValue}>ET0 x Kc</Text>
            </View>
          </View>

          {/* Weekly Water Need Card */}
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons name="watering-can" size={28} color={COLORS.info} />
              <View style={styles.resultHeaderText}>
                <Text style={styles.resultLabel}>Weekly Water Need</Text>
                <Text style={styles.resultValue}>{result.weeklyWaterLitersPerHa} L/ha</Text>
              </View>
            </View>
          </View>

          {/* Irrigation Recommendation */}
          {(() => {
            const rec = getIrrigationRecommendation();
            return (
              <View style={[styles.recommendationCard, { borderLeftColor: rec.color }]}>
                <MaterialCommunityIcons name={rec.icon} size={24} color={rec.color} />
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationTitle}>Irrigation Recommendation</Text>
                  <Text style={styles.recommendationText}>{rec.text}</Text>
                </View>
              </View>
            );
          })()}
        </View>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: '#E3F2FD',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.info,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  inputCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  inputLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  input: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    width: 50,
    textAlign: 'right',
    paddingVertical: SPACING.sm,
  },
  unitText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  cropScroll: {
    marginBottom: SPACING.xl,
  },
  cropChip: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySurface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginRight: SPACING.sm,
    minWidth: 80,
    gap: SPACING.xs,
  },
  cropChipActive: {
    backgroundColor: COLORS.primary,
  },
  cropChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primary,
  },
  cropChipTextActive: {
    color: COLORS.white,
  },
  cropKcText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  calculateText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  resultSection: {
    marginBottom: SPACING.xl,
  },
  resultCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  resultHeaderText: {
    flex: 1,
  },
  resultLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  resultValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  resultDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  resultSubLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  resultSubValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  recommendationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default ETCalculatorScreen;
