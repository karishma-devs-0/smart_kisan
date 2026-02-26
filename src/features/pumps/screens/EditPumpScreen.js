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
import { savePump, updatePumpField } from '../slice/pumpsSlice';

const PUMP_TYPES = ['Submersible', 'Centrifugal', 'Jet Pump', 'Booster'];

const EditPumpScreen = ({ navigation, route }) => {
  const { pumpId } = route.params || {};
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const pump = useSelector((state) =>
    state.pumps.pumps.find((p) => p.id === pumpId),
  ) || { id: pumpId, name: '', field: '', type: 'submersible', imageUri: null };

  const [pumpName, setPumpName] = useState(pump.name || '');
  const [fieldAssignment, setFieldAssignment] = useState(pump.field || '');
  const [pumpType, setPumpType] = useState(pump.type || 'submersible');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [imageUri, setImageUri] = useState(pump.imageUri || null);

  const handleSave = () => {
    if (!pumpName.trim()) {
      Alert.alert('Validation Error', 'Please enter a pump name.');
      return;
    }

    const updatedPump = {
      ...pump,
      name: pumpName.trim(),
      field: fieldAssignment.trim(),
      type: pumpType,
      imageUri,
    };

    dispatch(savePump(updatedPump));
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleImagePick = () => {
    Alert.alert(
      'Pick Image',
      'Image picker would open here. This is a placeholder for camera/gallery functionality.',
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
        <Text style={styles.headerTitle}>Edit Pump</Text>
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
              <Text style={styles.imagePreviewText}>Image selected</Text>
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
                Tap to add pump image
              </Text>
              <Text style={styles.imagePlaceholderSubtext}>
                Take a photo or choose from gallery
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Pump Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Pump Name</Text>
          <TextInput
            style={styles.textInput}
            value={pumpName}
            onChangeText={setPumpName}
            placeholder="Enter pump name"
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>

        {/* Field Assignment */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Field Assignment</Text>
          <TextInput
            style={styles.textInput}
            value={fieldAssignment}
            onChangeText={setFieldAssignment}
            placeholder="Enter field assignment"
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>

        {/* Pump Type */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Pump Type</Text>
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
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
            <Text style={styles.saveButtonText}>Save</Text>
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
    paddingBottom: SPACING.xxxxl,
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
