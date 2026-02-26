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
import { saveGroup } from '../slice/pumpsSlice';

const EditPumpGroupsScreen = ({ navigation, route }) => {
  const { groupId } = route.params || {};
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const pumps = useSelector((state) => state.pumps.pumps) || [];
  const existingGroup = useSelector((state) =>
    state.pumps.groups.find((g) => g.id === groupId),
  );

  const [groupName, setGroupName] = useState(existingGroup?.name || '');
  const [selectedPumpIds, setSelectedPumpIds] = useState(
    existingGroup?.pumpIds || [],
  );

  const togglePumpSelection = (pumpId) => {
    setSelectedPumpIds((prev) =>
      prev.includes(pumpId)
        ? prev.filter((id) => id !== pumpId)
        : [...prev, pumpId],
    );
  };

  const handleSave = () => {
    if (!groupName.trim()) {
      Alert.alert('Validation Error', 'Please enter a group name.');
      return;
    }
    if (selectedPumpIds.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one pump.');
      return;
    }

    const group = {
      id: groupId || String(Date.now()),
      name: groupName.trim(),
      pumpIds: selectedPumpIds,
      soilMoisture: existingGroup?.soilMoisture || null,
      fieldImage: existingGroup?.fieldImage || null,
    };

    dispatch(saveGroup(group));
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.goBack();
  };

  // Calculate average soil moisture for selected pumps
  const selectedPumps = pumps.filter((p) => selectedPumpIds.includes(p.id));
  const avgMoisture =
    selectedPumps.length > 0
      ? Math.round(
          selectedPumps.reduce((sum, p) => sum + (p.soilMoisture || 0), 0) /
            selectedPumps.length,
        )
      : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Pump Groups</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
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
        {/* Group Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Group Name</Text>
          <TextInput
            style={styles.textInput}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Enter group name"
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>

        {/* Soil Moisture Display */}
        {avgMoisture !== null && (
          <View style={styles.moistureCard}>
            <View style={styles.moistureIconContainer}>
              <MaterialCommunityIcons
                name="water-percent"
                size={24}
                color={COLORS.info}
              />
            </View>
            <View style={styles.moistureInfo}>
              <Text style={styles.moistureLabel}>Avg. Soil Moisture</Text>
              <Text style={styles.moistureValue}>{avgMoisture}%</Text>
            </View>
            <View style={styles.moistureBar}>
              <View
                style={[styles.moistureFill, { width: `${avgMoisture}%` }]}
              />
            </View>
          </View>
        )}

        {/* Pump Selection */}
        <Text style={styles.sectionTitle}>Select Pumps</Text>
        <Text style={styles.sectionSubtitle}>
          Choose which pumps belong to this group
        </Text>

        {pumps.map((pump) => {
          const isSelected = selectedPumpIds.includes(pump.id);
          return (
            <TouchableOpacity
              key={pump.id}
              style={[styles.pumpItem, isSelected && styles.pumpItemSelected]}
              onPress={() => togglePumpSelection(pump.id)}
              activeOpacity={0.7}
            >
              <View style={styles.checkboxContainer}>
                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxChecked,
                  ]}
                >
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check"
                      size={16}
                      color={COLORS.white}
                    />
                  )}
                </View>
              </View>

              <View style={styles.pumpIconContainer}>
                <MaterialCommunityIcons
                  name="water-pump"
                  size={24}
                  color={isSelected ? COLORS.primary : COLORS.textSecondary}
                />
              </View>

              <View style={styles.pumpInfo}>
                <Text
                  style={[
                    styles.pumpName,
                    isSelected && styles.pumpNameSelected,
                  ]}
                >
                  {pump.name}
                </Text>
                <Text style={styles.pumpField}>
                  {pump.field || 'No field assigned'}
                </Text>
              </View>

              {pump.soilMoisture !== undefined && (
                <View style={styles.pumpMoistureBadge}>
                  <MaterialCommunityIcons
                    name="water-percent"
                    size={12}
                    color={COLORS.info}
                  />
                  <Text style={styles.pumpMoistureText}>
                    {pump.soilMoisture}%
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Selected Count */}
        <Text style={styles.selectedCountText}>
          {selectedPumpIds.length} pump{selectedPumpIds.length !== 1 ? 's' : ''} selected
        </Text>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (selectedPumpIds.length === 0 || !groupName.trim()) &&
              styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={selectedPumpIds.length === 0 || !groupName.trim()}
        >
          <MaterialCommunityIcons
            name="content-save"
            size={20}
            color={COLORS.white}
          />
          <Text style={styles.saveButtonText}>Save Group</Text>
        </TouchableOpacity>
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
  moistureCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  moistureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  moistureInfo: {
    flex: 1,
  },
  moistureLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  moistureValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.info,
  },
  moistureBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginTop: SPACING.md,
  },
  moistureFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.info,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  pumpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  pumpItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  checkboxContainer: {
    marginRight: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pumpIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  pumpInfo: {
    flex: 1,
  },
  pumpName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  pumpNameSelected: {
    color: COLORS.primary,
  },
  pumpField: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pumpMoistureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
  },
  pumpMoistureText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.info,
  },
  selectedCountText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: SPACING.lg,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default EditPumpGroupsScreen;
