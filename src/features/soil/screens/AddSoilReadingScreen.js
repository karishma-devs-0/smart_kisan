import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { addSoilReading } from '../slice/soilSlice';
import { fetchFields } from '../../fields/slice/fieldsSlice';
import ScreenLayout from '../../../components/common/ScreenLayout';

const SOURCE_OPTIONS = [
  { key: 'manual', label: 'Manual Entry', icon: 'pencil' },
  { key: 'sensor', label: 'Sensor Data', icon: 'access-point' },
  { key: 'lab', label: 'Lab Report', icon: 'flask-outline' },
];

const TEXTURE_OPTIONS = [
  'Sandy', 'Loamy', 'Clay', 'Silt', 'Sandy Loam', 'Clay Loam',
];

const AddSoilReadingScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const fields = useSelector((state) => state.fields.fields);

  const [source, setSource] = useState('manual');
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [showTexturePicker, setShowTexturePicker] = useState(false);

  // Form values
  const [moisture, setMoisture] = useState('');
  const [pH, setPH] = useState('');
  const [nitrogen, setNitrogen] = useState('');
  const [phosphorus, setPhosphorus] = useState('');
  const [potassium, setPotassium] = useState('');
  const [organicCarbon, setOrganicCarbon] = useState('');
  const [ec, setEc] = useState('');
  const [texture, setTexture] = useState('');

  useEffect(() => {
    dispatch(fetchFields());
  }, [dispatch]);

  useEffect(() => {
    if (fields.length > 0 && !selectedFieldId) {
      setSelectedFieldId(fields[0].id);
    }
  }, [fields, selectedFieldId]);

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const handleSave = () => {
    if (!moisture && !pH) {
      Alert.alert('Validation Error', 'Please enter at least Moisture or pH value.');
      return;
    }

    const reading = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      source,
      fieldId: selectedFieldId,
      fieldName: selectedField?.name || 'Unknown',
      moisture: moisture ? parseFloat(moisture) : null,
      pH: pH ? parseFloat(pH) : null,
      nitrogen: nitrogen ? parseFloat(nitrogen) : null,
      phosphorus: phosphorus ? parseFloat(phosphorus) : null,
      potassium: potassium ? parseFloat(potassium) : null,
      organicCarbon: organicCarbon ? parseFloat(organicCarbon) : null,
      ec: ec ? parseFloat(ec) : null,
      texture: texture || null,
    };

    dispatch(addSoilReading(reading));
    Alert.alert('Success', 'Soil reading saved successfully.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const renderSliderInput = (label, value, setValue, min, max, step, unit, icon, color) => {
    const numValue = value ? parseFloat(value) : 0;
    const fillPercent = max > min ? ((numValue - min) / (max - min)) * 100 : 0;

    return (
      <View style={styles.inputGroup}>
        <View style={styles.inputHeader}>
          <MaterialCommunityIcons name={icon} size={18} color={color} />
          <Text style={styles.inputLabel}>{label}</Text>
          <Text style={styles.inputUnit}>{unit}</Text>
        </View>
        <View style={styles.sliderRow}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(fillPercent, 100)}%`, backgroundColor: color }]} />
          </View>
          <TextInput
            style={[styles.sliderInput, { borderColor: color }]}
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            placeholder="--"
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>
      </View>
    );
  };

  const renderForm = () => (
    <>
      {renderSliderInput('Moisture', moisture, setMoisture, 0, 100, 1, '%', 'water-percent', COLORS.chartMoisture)}
      {renderSliderInput('pH', pH, setPH, 0, 14, 0.1, '', 'test-tube', COLORS.chartPH)}
      {renderSliderInput('Nitrogen', nitrogen, setNitrogen, 0, 100, 1, '%', 'leaf', COLORS.chartNPK_N)}
      {renderSliderInput('Phosphorus', phosphorus, setPhosphorus, 0, 100, 1, '%', 'flask', COLORS.chartNPK_P)}
      {renderSliderInput('Potassium', potassium, setPotassium, 0, 100, 1, '%', 'atom', COLORS.chartNPK_K)}
      {renderSliderInput('Organic Carbon', organicCarbon, setOrganicCarbon, 0, 2, 0.01, '%', 'molecule', COLORS.primary)}
      {renderSliderInput('EC', ec, setEc, 0, 5, 0.1, 'dS/m', 'flash', COLORS.info)}

      {/* Soil Texture Picker */}
      <View style={styles.inputGroup}>
        <View style={styles.inputHeader}>
          <MaterialCommunityIcons name="grain" size={18} color={COLORS.textSecondary} />
          <Text style={styles.inputLabel}>Soil Texture</Text>
        </View>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowTexturePicker(!showTexturePicker)}
        >
          <Text style={texture ? styles.pickerText : styles.pickerPlaceholder}>
            {texture || 'Select texture...'}
          </Text>
          <MaterialCommunityIcons
            name={showTexturePicker ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
        {showTexturePicker && (
          <View style={styles.pickerOptions}>
            {TEXTURE_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pickerOption, texture === t && styles.pickerOptionActive]}
                onPress={() => { setTexture(t); setShowTexturePicker(false); }}
              >
                <Text style={[styles.pickerOptionText, texture === t && styles.pickerOptionTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </>
  );

  const renderSensorPlaceholder = () => (
    <View style={styles.placeholderContainer}>
      <MaterialCommunityIcons name="access-point-network" size={80} color={COLORS.textTertiary} />
      <Text style={styles.placeholderTitle}>Connect to Sensor</Text>
      <Text style={styles.placeholderSubtitle}>
        Pair your soil sensor device to automatically import readings.
      </Text>
      <TouchableOpacity style={styles.connectButton}>
        <MaterialCommunityIcons name="bluetooth-connect" size={20} color={COLORS.white} />
        <Text style={styles.connectButtonText}>Scan for Devices</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLabSource = () => (
    <>
      <View style={styles.labPhotoContainer}>
        <TouchableOpacity style={styles.labPhotoButton}>
          <MaterialCommunityIcons name="camera" size={40} color={COLORS.primaryLight} />
          <Text style={styles.labPhotoText}>Take Photo of Lab Report</Text>
          <Text style={styles.labPhotoSubtext}>Coming soon - auto-extract values from report</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.labDivider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR enter manually</Text>
        <View style={styles.dividerLine} />
      </View>
      {renderForm()}
    </>
  );

  return (
    <ScreenLayout
      title="Add Soil Reading"
      showBack
      onBack={() => navigation.goBack()}
      scrollable={true}
    >
      {/* Source Selector */}
      <View style={styles.sourceSelector}>
        {SOURCE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sourceOption, source === opt.key && styles.sourceOptionActive]}
            onPress={() => setSource(opt.key)}
          >
            <MaterialCommunityIcons
              name={opt.icon}
              size={18}
              color={source === opt.key ? COLORS.white : COLORS.textSecondary}
            />
            <Text style={[styles.sourceText, source === opt.key && styles.sourceTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Field Selector */}
      <View style={styles.fieldSelector}>
        <Text style={styles.sectionLabel}>Field</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowFieldPicker(!showFieldPicker)}
        >
          <MaterialCommunityIcons name="map-marker" size={18} color={COLORS.primaryLight} />
          <Text style={styles.pickerText}>
            {selectedField?.name || 'Select field...'}
          </Text>
          <MaterialCommunityIcons
            name={showFieldPicker ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
        {showFieldPicker && (
          <View style={styles.pickerOptions}>
            {fields.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.pickerOption, selectedFieldId === f.id && styles.pickerOptionActive]}
                onPress={() => { setSelectedFieldId(f.id); setShowFieldPicker(false); }}
              >
                <Text style={[styles.pickerOptionText, selectedFieldId === f.id && styles.pickerOptionTextActive]}>
                  {f.name}
                </Text>
              </TouchableOpacity>
            ))}
            {fields.length === 0 && (
              <Text style={styles.noFieldsText}>No fields available</Text>
            )}
          </View>
        )}
      </View>

      {/* Content based on source */}
      {source === 'manual' && renderForm()}
      {source === 'sensor' && renderSensorPlaceholder()}
      {source === 'lab' && renderLabSource()}

      {/* Save Button */}
      {source !== 'sensor' && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <MaterialCommunityIcons name="content-save" size={20} color={COLORS.white} />
          <Text style={styles.saveButtonText}>Save Reading</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: SPACING.xxxl }} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  sourceSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
    marginBottom: SPACING.xl,
    gap: SPACING.xs,
  },
  sourceOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  sourceOptionActive: {
    backgroundColor: COLORS.primaryLight,
    ...SHADOWS.sm,
  },
  sourceText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  sourceTextActive: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  fieldSelector: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  pickerText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  pickerPlaceholder: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textTertiary,
  },
  pickerOptions: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  pickerOption: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  pickerOptionActive: {
    backgroundColor: COLORS.primarySurface,
  },
  pickerOptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  pickerOptionTextActive: {
    color: COLORS.primaryLight,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  noFieldsText: {
    padding: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
  },
  inputUnit: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sliderInput: {
    width: 64,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl * 2,
  },
  placeholderTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  placeholderSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
    marginTop: SPACING.xxl,
  },
  connectButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
  labPhotoContainer: {
    marginBottom: SPACING.xl,
  },
  labPhotoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySurface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primaryLight + '40',
    borderStyle: 'dashed',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  labPhotoText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primaryLight,
    marginTop: SPACING.md,
  },
  labPhotoSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  labDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    ...SHADOWS.md,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default AddSoilReadingScreen;
