import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { useTranslation } from 'react-i18next';
import { savePump, updatePumpField } from '../slice/pumpsSlice';

const getPumpTypes = (t) => [t('editPump.submersible'), t('editPump.centrifugal'), t('editPump.jetPump'), t('editPump.booster')];

const MODE_COLORS = { manual: '#607D8B', automatic: '#FF9800', timer: '#2196F3', schedule: '#9C27B0', sensor: '#00BCD4', ai: '#4CAF50' };

const CONTROL_MODES = [
  { id: 'manual', icon: 'hand-back-right', labelKey: 'pumps.modes.manual', descKey: 'editPump.modeManualDesc' },
  { id: 'automatic', icon: 'auto-fix', labelKey: 'pumps.modes.auto', descKey: 'editPump.modeAutoDesc' },
  { id: 'timer', icon: 'timer-outline', labelKey: 'pumps.modes.timer', descKey: 'editPump.modeTimerDesc' },
  { id: 'schedule', icon: 'calendar-clock', labelKey: 'pumps.modes.schedule', descKey: 'editPump.modeScheduleDesc' },
  { id: 'sensor', icon: 'access-point', labelKey: 'pumps.modes.sensor', descKey: 'editPump.modeSensorDesc' },
  { id: 'ai', icon: 'robot', labelKey: 'pumps.modes.ai', descKey: 'editPump.modeAiDesc' },
];

const EditPumpScreen = ({ navigation, route }) => {
  const { pumpId } = route.params || {};
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const PUMP_TYPES = getPumpTypes(t);
  const isNewPump = !pumpId;

  const pump = useSelector((state) =>
    state.pumps.pumps.find((p) => p.id === pumpId),
  ) || { id: pumpId, name: '', field: '', type: 'submersible', imageUri: null };

  const [pumpName, setPumpName] = useState(pump.name || '');
  const [fieldAssignment, setFieldAssignment] = useState(pump.field || '');
  const [pumpType, setPumpType] = useState(pump.type || 'submersible');
  const [pumpMode, setPumpMode] = useState(pump.mode || 'manual');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [imageUri, setImageUri] = useState(pump.imageUri || null);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!pumpName.trim()) {
      Alert.alert(t('editPump.validationError'), t('editPump.enterPumpName'));
      return;
    }

    const updatedPump = {
      ...pump,
      name: pumpName.trim(),
      field: fieldAssignment.trim(),
      type: pumpType,
      mode: pumpMode,
      imageUri,
      ...(isNewPump && {
        status: 'off',
        lastRun: null,
        nextRun: null,
      }),
    };

    // Remove undefined id so the service layer knows this is a new pump
    if (!updatedPump.id) {
      delete updatedPump.id;
    }

    if (__DEV__) console.log('[Pump] Saving pump:', JSON.stringify(updatedPump, null, 2));
    setSaving(true);
    try {
      const result = await dispatch(savePump(updatedPump)).unwrap();
      if (__DEV__) console.log('[Pump] Save success:', JSON.stringify(result));
      navigation.goBack();
    } catch (error) {
      if (__DEV__) console.log('[Pump] Save error:', error);
      Alert.alert(
        t('common.error') || 'Error',
        error || t('editPump.saveFailed') || 'Failed to save pump. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleImagePick = () => {
    Alert.alert(
      t('editPump.pickImage'),
      t('editPump.pickImageDesc'),
    );
  };

  const handleTypeSelect = (type) => {
    setPumpType(type.toLowerCase());
    setShowTypeDropdown(false);
  };

  const getTypeLabel = () => {
    return pumpType.charAt(0).toUpperCase() + pumpType.slice(1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('editPump.title')}</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleCancel}
        >
          <MaterialCommunityIcons
            name="close"
            size={24}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image Picker */}
        <TouchableOpacity
          style={styles.imagePicker}
          onPress={handleImagePick}
          activeOpacity={0.7}
        >
          {imageUri ? (
            <View style={styles.imagePreview}>
              <MaterialCommunityIcons
                name="image"
                size={48}
                color={COLORS.primary}
              />
              <Text style={styles.imagePreviewText}>{t('editPump.imageSelected')}</Text>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.cameraIconContainer}>
                <MaterialCommunityIcons
                  name="camera"
                  size={32}
                  color={COLORS.textSecondary}
                />
              </View>
              <Text style={styles.imagePlaceholderText}>
                {t('editPump.tapToAddImage')}
              </Text>
              <Text style={styles.imagePlaceholderSubtext}>
                {t('editPump.takePhotoOrGallery')}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Pump Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('editPump.pumpName')}</Text>
          <TextInput
            style={styles.textInput}
            value={pumpName}
            onChangeText={setPumpName}
            placeholder={t('editPump.pumpNamePlaceholder')}
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>

        {/* Field Assignment */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('editPump.fieldAssignment')}</Text>
          <TextInput
            style={styles.textInput}
            value={fieldAssignment}
            onChangeText={setFieldAssignment}
            placeholder={t('editPump.fieldAssignmentPlaceholder')}
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>

        {/* Control Mode */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            {isNewPump ? t('editPump.controlModeDesc') : t('editPump.controlMode')}
          </Text>
          <View style={styles.modeGrid}>
            {CONTROL_MODES.map((mode) => {
              const isSelected = pumpMode === mode.id;
              const color = MODE_COLORS[mode.id];
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.modeCard,
                    isSelected && { borderColor: color, backgroundColor: color + '12' },
                  ]}
                  onPress={() => setPumpMode(mode.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modeCardIcon, { backgroundColor: color + '1A' }]}>
                    <MaterialCommunityIcons
                      name={mode.icon}
                      size={24}
                      color={isSelected ? color : COLORS.textSecondary}
                    />
                  </View>
                  <Text style={[styles.modeCardLabel, isSelected && { color }]}>
                    {t(mode.labelKey)}
                  </Text>
                  <Text style={styles.modeCardDesc} numberOfLines={2}>
                    {t(mode.descKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Pump Type */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>{t('editPump.pumpType')}</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowTypeDropdown(!showTypeDropdown)}
          >
            <Text style={styles.dropdownButtonText}>{getTypeLabel()}</Text>
            <MaterialCommunityIcons
              name={showTypeDropdown ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {showTypeDropdown && (
            <View style={styles.dropdownList}>
              {PUMP_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.dropdownItem,
                    pumpType === type.toLowerCase() && styles.dropdownItemActive,
                  ]}
                  onPress={() => handleTypeSelect(type)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      pumpType === type.toLowerCase() && styles.dropdownItemTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                  {pumpType === type.toLowerCase() && (
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={saving}
          >
            <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
            <Text style={styles.saveButtonText}>{saving ? (t('common.saving') || 'Saving...') : t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  imagePicker: {
    marginBottom: SPACING.xxl,
  },
  imagePlaceholder: {
    height: 180,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  imagePlaceholderText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
  },
  imagePlaceholderSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  imagePreview: {
    height: 180,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginTop: SPACING.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  fieldContainer: {
    marginBottom: SPACING.xl,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  dropdownButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  dropdownButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  dropdownList: {
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.white,
    ...SHADOWS.md,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primarySurface,
  },
  dropdownItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  dropdownItemTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  modeCard: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  modeCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  modeCardLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  modeCardDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xxl,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default EditPumpScreen;
