import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { saveField } from '../slice/fieldsSlice';

const SOIL_TYPES = ['Loamy', 'Sandy', 'Clay', 'Silt', 'Sandy Loam', 'Clay Loam'];
const IRRIGATION_TYPES = ['drip', 'sprinkler', 'flood', 'manual'];
const STATUS_OPTIONS = ['active', 'fallow', 'harvested'];

const AddFieldScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { saving } = useSelector((state) => state.fields);

  const [name, setName] = useState('');
  const [crop, setCrop] = useState('');
  const [area, setArea] = useState('');
  const [soilType, setSoilType] = useState('Loamy');
  const [irrigationType, setIrrigationType] = useState('drip');
  const [status, setStatus] = useState('active');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Field name is required.');
      return;
    }
    const areaNum = parseFloat(area);
    if (!area || isNaN(areaNum) || areaNum <= 0) {
      Alert.alert('Validation', 'Enter a valid area (in acres).');
      return;
    }

    const field = {
      id: Date.now().toString(),
      name: name.trim(),
      crop: crop.trim() || 'Unassigned',
      area: areaNum,
      soilType,
      irrigationType,
      status,
      growthStage: 'seedling',
      growthProgress: 0,
      lastIrrigation: new Date().toISOString(),
      nextIrrigation: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    dispatch(saveField(field))
      .unwrap()
      .then(() => {
        Alert.alert('Success', 'Field added.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      })
      .catch((e) => Alert.alert('Error', e || 'Failed to save field.'));
  };

  const Chip = ({ label, active, onPress }) => (
    <TouchableOpacity
      style={[s.chip, active && s.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout title="Add Field" showBack onBack={() => navigation.goBack()} scrollable>
      <Text style={s.label}>Field Name *</Text>
      <TextInput
        style={s.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. North Field"
        placeholderTextColor={COLORS.textTertiary}
      />

      <Text style={s.label}>Crop</Text>
      <TextInput
        style={s.input}
        value={crop}
        onChangeText={setCrop}
        placeholder="e.g. Wheat"
        placeholderTextColor={COLORS.textTertiary}
      />

      <Text style={s.label}>Area (acres) *</Text>
      <TextInput
        style={s.input}
        value={area}
        onChangeText={setArea}
        keyboardType="numeric"
        placeholder="e.g. 2.5"
        placeholderTextColor={COLORS.textTertiary}
      />

      <Text style={s.label}>Soil Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
        {SOIL_TYPES.map((t) => (
          <Chip key={t} label={t} active={soilType === t} onPress={() => setSoilType(t)} />
        ))}
      </ScrollView>

      <Text style={s.label}>Irrigation Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
        {IRRIGATION_TYPES.map((t) => (
          <Chip key={t} label={t} active={irrigationType === t} onPress={() => setIrrigationType(t)} />
        ))}
      </ScrollView>

      <Text style={s.label}>Status</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
        {STATUS_OPTIONS.map((t) => (
          <Chip key={t} label={t} active={status === t} onPress={() => setStatus(t)} />
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[s.saveBtn, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="content-save" size={20} color={COLORS.white} />
        <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Field'}</Text>
      </TouchableOpacity>

      <View style={{ height: SPACING.xxxl }} />
    </ScreenLayout>
  );
};

const s = StyleSheet.create({
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  chipRow: { flexDirection: 'row' },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
  },
  chipActive: { backgroundColor: COLORS.primaryLight },
  chipText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: COLORS.white, fontWeight: FONT_WEIGHTS.semiBold },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    marginTop: SPACING.xxl,
    ...SHADOWS.md,
  },
  saveBtnText: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
});

export default AddFieldScreen;
