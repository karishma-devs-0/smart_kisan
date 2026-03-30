import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { fetchRecommendations } from '../slice/cropRecommendSlice';

// ─── Input Field Component ──────────────────────────────────────────────────

const InputField = ({ label, value, onChangeText, placeholder, unit, keyboardType = 'numeric' }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}{unit ? ` (${unit})` : ''}</Text>
    <TextInput
      style={styles.textInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder || label}
      placeholderTextColor={COLORS.textTertiary}
      keyboardType={keyboardType}
    />
  </View>
);

// ─── Main Screen ────────────────────────────────────────────────────────────

const CropRecommendInputScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { soilParams: existingSoil, climateParams: existingClimate } = useSelector(
    (state) => state.cropRecommend,
  );

  // Soil params
  const [nitrogen, setNitrogen] = useState(String(existingSoil?.nitrogen ?? ''));
  const [phosphorus, setPhosphorus] = useState(String(existingSoil?.phosphorus ?? ''));
  const [potassium, setPotassium] = useState(String(existingSoil?.potassium ?? ''));
  const [ph, setPh] = useState(String(existingSoil?.ph ?? ''));
  const [organicCarbon, setOrganicCarbon] = useState(String(existingSoil?.organicCarbon ?? ''));
  const [texture, setTexture] = useState(existingSoil?.texture ?? '');

  // Climate params
  const [rainfall, setRainfall] = useState(String(existingClimate?.rainfall ?? ''));
  const [avgTemp, setAvgTemp] = useState(String(existingClimate?.avgTemp ?? ''));
  const [humidity, setHumidity] = useState(String(existingClimate?.humidity ?? ''));

  // Region
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');

  const handleAnalyze = () => {
    if (!nitrogen || !phosphorus || !potassium || !ph) {
      Alert.alert(
        t('cropRecommend.missingTitle', { defaultValue: 'Missing Data' }),
        t('cropRecommend.missingMsg', { defaultValue: 'Please fill in at least N, P, K, and pH values.' }),
      );
      return;
    }

    const soilParams = {
      nitrogen: parseFloat(nitrogen),
      phosphorus: parseFloat(phosphorus),
      potassium: parseFloat(potassium),
      ph: parseFloat(ph),
      organicCarbon: organicCarbon ? parseFloat(organicCarbon) : null,
      texture: texture || null,
    };

    const climateParams = {
      rainfall: rainfall ? parseFloat(rainfall) : null,
      avgTemp: avgTemp ? parseFloat(avgTemp) : null,
      humidity: humidity ? parseFloat(humidity) : null,
    };

    dispatch(fetchRecommendations({ soilParams, climateParams }));
    navigation.goBack();
  };

  return (
    <ScreenLayout
      title={t('cropRecommend.inputTitle', { defaultValue: 'Soil & Climate Input' })}
      showBack
      onBack={() => navigation.goBack()}
    >
      {/* Soil Parameters Section */}
      <Text style={styles.sectionTitle}>
        <MaterialCommunityIcons name="shovel" size={16} color={COLORS.primaryLight} />
        {'  '}
        {t('cropRecommend.soilParams', { defaultValue: 'Soil Parameters' })}
      </Text>
      <View style={styles.card}>
        <View style={styles.inputRow}>
          <InputField label="Nitrogen (N)" value={nitrogen} onChangeText={setNitrogen} unit="kg/ha" />
          <InputField label="Phosphorus (P)" value={phosphorus} onChangeText={setPhosphorus} unit="kg/ha" />
        </View>
        <View style={styles.inputRow}>
          <InputField label="Potassium (K)" value={potassium} onChangeText={setPotassium} unit="kg/ha" />
          <InputField label="pH" value={ph} onChangeText={setPh} />
        </View>
        <View style={styles.inputRow}>
          <InputField label="Organic Carbon" value={organicCarbon} onChangeText={setOrganicCarbon} unit="%" />
          <InputField
            label="Soil Texture"
            value={texture}
            onChangeText={setTexture}
            placeholder="e.g. Loamy"
            keyboardType="default"
          />
        </View>
      </View>

      {/* Climate Data Section */}
      <Text style={styles.sectionTitle}>
        <MaterialCommunityIcons name="weather-partly-cloudy" size={16} color={COLORS.info} />
        {'  '}
        {t('cropRecommend.climateData', { defaultValue: 'Climate Data' })}
      </Text>
      <View style={styles.card}>
        <View style={styles.inputRow}>
          <InputField label="Rainfall" value={rainfall} onChangeText={setRainfall} unit="mm/yr" />
          <InputField label="Avg Temp" value={avgTemp} onChangeText={setAvgTemp} unit="°C" />
        </View>
        <View style={styles.inputRow}>
          <InputField label="Humidity" value={humidity} onChangeText={setHumidity} unit="%" />
          <View style={styles.inputGroup} />
        </View>
      </View>

      {/* Region Section */}
      <Text style={styles.sectionTitle}>
        <MaterialCommunityIcons name="map-marker-outline" size={16} color={COLORS.warning} />
        {'  '}
        {t('cropRecommend.region', { defaultValue: 'Region' })}
      </Text>
      <View style={styles.card}>
        <View style={styles.inputRow}>
          <InputField
            label="State"
            value={state}
            onChangeText={setState}
            placeholder="e.g. Maharashtra"
            keyboardType="default"
          />
          <InputField
            label="District"
            value={district}
            onChangeText={setDistrict}
            placeholder="e.g. Pune"
            keyboardType="default"
          />
        </View>
      </View>

      {/* Analyze Button */}
      <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze} activeOpacity={0.8}>
        <MaterialCommunityIcons name="chart-box-outline" size={20} color={COLORS.white} />
        <Text style={styles.analyzeButtonText}>
          {t('cropRecommend.analyze', { defaultValue: 'Analyze & Recommend' })}
        </Text>
      </TouchableOpacity>

      <View style={{ height: SPACING.xxl }} />
    </ScreenLayout>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.xxl,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  analyzeButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default CropRecommendInputScreen;
