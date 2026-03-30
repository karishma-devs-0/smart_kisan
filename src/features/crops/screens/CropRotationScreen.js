import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { saveRotationPlan } from '../slice/cropsSlice';

// ─── Crop Database ────────────────────────────────────────────────────────────

const ROTATION_CROPS = [
  { name: 'Rice', season: 'kharif', icon: 'grain', family: 'cereal', soilBenefit: 'neutral' },
  { name: 'Wheat', season: 'rabi', icon: 'barley', family: 'cereal', soilBenefit: 'neutral' },
  { name: 'Moong', season: 'zaid', icon: 'seed', family: 'legume', soilBenefit: 'nitrogen-fixing' },
  { name: 'Cotton', season: 'kharif', icon: 'flower', family: 'fiber', soilBenefit: 'neutral' },
  { name: 'Potato', season: 'rabi', icon: 'food-apple', family: 'tuber', soilBenefit: 'neutral' },
  { name: 'Sunflower', season: 'zaid', icon: 'white-balance-sunny', family: 'oilseed', soilBenefit: 'deep-root' },
  { name: 'Maize', season: 'kharif', icon: 'corn', family: 'cereal', soilBenefit: 'neutral' },
  { name: 'Mustard', season: 'rabi', icon: 'flower', family: 'oilseed', soilBenefit: 'pest-repellent' },
  { name: 'Sugarcane', season: 'kharif', icon: 'grass', family: 'cash', soilBenefit: 'organic-matter' },
  { name: 'Green Manure', season: 'zaid', icon: 'leaf', family: 'cover', soilBenefit: 'nitrogen-fixing' },
  { name: 'Tomato', season: 'rabi', icon: 'food-apple', family: 'vegetable', soilBenefit: 'neutral' },
  { name: 'Fodder', season: 'zaid', icon: 'grass', family: 'fodder', soilBenefit: 'organic-matter' },
];

// ─── Templates ────────────────────────────────────────────────────────────────

const ROTATION_TEMPLATES = [
  {
    name: 'Rice-Wheat-Moong',
    subtitle: 'Classic North India',
    icon: 'grain',
    plan: [
      ['Rice', 'Wheat', 'Moong'],
      ['Rice', 'Wheat', 'Moong'],
      ['Rice', 'Wheat', 'Moong'],
    ],
  },
  {
    name: 'Cotton-Wheat-Fodder',
    subtitle: 'Cash + Food + Livestock',
    icon: 'flower',
    plan: [
      ['Cotton', 'Wheat', 'Fodder'],
      ['Cotton', 'Wheat', 'Fodder'],
      ['Cotton', 'Wheat', 'Fodder'],
    ],
  },
  {
    name: 'Maize-Potato-Sunflower',
    subtitle: 'Diversified Rotation',
    icon: 'corn',
    plan: [
      ['Maize', 'Potato', 'Sunflower'],
      ['Maize', 'Potato', 'Sunflower'],
      ['Maize', 'Potato', 'Sunflower'],
    ],
  },
  {
    name: 'Sugarcane-Wheat-Green Manure',
    subtitle: 'Soil Restoration',
    icon: 'grass',
    plan: [
      ['Sugarcane', 'Wheat', 'Green Manure'],
      ['Sugarcane', 'Wheat', 'Green Manure'],
      ['Sugarcane', 'Wheat', 'Green Manure'],
    ],
  },
];

const SEASONS = [
  { key: 'kharif', label: 'Kharif', period: 'Jun-Oct', color: '#4CAF50' },
  { key: 'rabi', label: 'Rabi', period: 'Nov-Mar', color: '#FF9800' },
  { key: 'zaid', label: 'Zaid', period: 'Apr-Jun', color: '#2196F3' },
];

const BENEFITS = [
  { icon: 'leaf', title: 'Soil Health', desc: 'Alternating crop families restores soil nutrients and improves structure.' },
  { icon: 'bug', title: 'Pest Control', desc: 'Breaking pest cycles reduces infestations without excess pesticides.' },
  { icon: 'trending-up', title: 'Yield Improvement', desc: 'Healthy soil and fewer pests lead to 10-25% higher yields over time.' },
  { icon: 'water', title: 'Water Efficiency', desc: 'Deep-rooted crops improve water infiltration for subsequent shallow-rooted ones.' },
];

const getCropByName = (name) => ROTATION_CROPS.find((c) => c.name === name);

const createEmptyPlan = () => [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

// ─── Components ───────────────────────────────────────────────────────────────

const TemplateCard = React.memo(({ template, onPress, isActive }) => (
  <TouchableOpacity
    style={[styles.templateCard, isActive && styles.templateCardActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <MaterialCommunityIcons
      name={template.icon}
      size={24}
      color={isActive ? COLORS.white : COLORS.primaryLight}
    />
    <Text style={[styles.templateName, isActive && styles.templateNameActive]} numberOfLines={1}>
      {template.name}
    </Text>
    <Text style={[styles.templateSub, isActive && styles.templateSubActive]} numberOfLines={1}>
      {template.subtitle}
    </Text>
  </TouchableOpacity>
));

const GridCell = React.memo(({ cropName, seasonIdx, onPress }) => {
  const crop = cropName ? getCropByName(cropName) : null;
  const season = SEASONS[seasonIdx];

  return (
    <TouchableOpacity
      style={[styles.gridCell, { borderLeftColor: season.color, borderLeftWidth: 3 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {crop ? (
        <>
          <MaterialCommunityIcons name={crop.icon} size={28} color={season.color} />
          <Text style={styles.cellCropName} numberOfLines={1}>{crop.name}</Text>
          <Text style={styles.cellFamily}>{crop.family}</Text>
        </>
      ) : (
        <>
          <MaterialCommunityIcons name="plus-circle-outline" size={28} color={COLORS.textTertiary} />
          <Text style={styles.cellPlaceholder}>Select</Text>
        </>
      )}
    </TouchableOpacity>
  );
});

const BenefitItem = React.memo(({ benefit }) => (
  <View style={styles.benefitItem}>
    <View style={styles.benefitIcon}>
      <MaterialCommunityIcons name={benefit.icon} size={22} color={COLORS.primaryLight} />
    </View>
    <View style={styles.benefitContent}>
      <Text style={styles.benefitTitle}>{benefit.title}</Text>
      <Text style={styles.benefitDesc}>{benefit.desc}</Text>
    </View>
  </View>
));

const CropPickerItem = React.memo(({ crop, onSelect }) => (
  <TouchableOpacity style={styles.pickerItem} onPress={() => onSelect(crop.name)} activeOpacity={0.7}>
    <MaterialCommunityIcons name={crop.icon} size={28} color={COLORS.primaryLight} />
    <View style={styles.pickerInfo}>
      <Text style={styles.pickerName}>{crop.name}</Text>
      <Text style={styles.pickerMeta}>{crop.family} | {crop.soilBenefit}</Text>
    </View>
    <View style={[styles.pickerSeasonBadge, { backgroundColor: SEASONS.find((s) => s.key === crop.season)?.color + '20' }]}>
      <Text style={[styles.pickerSeasonText, { color: SEASONS.find((s) => s.key === crop.season)?.color }]}>
        {crop.season}
      </Text>
    </View>
  </TouchableOpacity>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────

const CropRotationScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const savedPlan = useSelector((s) => s.crops.rotationPlan);

  const [plan, setPlan] = useState(savedPlan || createEmptyPlan());
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState({ year: 0, season: 0 });

  const handleTemplatePress = useCallback((template, index) => {
    setActiveTemplate(index);
    setPlan(template.plan.map((row) => [...row]));
  }, []);

  const handleCellPress = useCallback((yearIdx, seasonIdx) => {
    setPickerTarget({ year: yearIdx, season: seasonIdx });
    setPickerVisible(true);
  }, []);

  const handleCropSelect = useCallback((cropName) => {
    setPlan((prev) => {
      const next = prev.map((row) => [...row]);
      next[pickerTarget.year][pickerTarget.season] = cropName;
      return next;
    });
    setActiveTemplate(null);
    setPickerVisible(false);
  }, [pickerTarget]);

  const handleClearCell = useCallback(() => {
    setPlan((prev) => {
      const next = prev.map((row) => [...row]);
      next[pickerTarget.year][pickerTarget.season] = null;
      return next;
    });
    setActiveTemplate(null);
    setPickerVisible(false);
  }, [pickerTarget]);

  const handleSave = useCallback(() => {
    const hasAnyCrop = plan.some((row) => row.some((c) => c !== null));
    if (!hasAnyCrop) {
      Alert.alert('Empty Plan', 'Please select at least one crop before saving.');
      return;
    }
    dispatch(saveRotationPlan(plan));
    Alert.alert('Saved', 'Your crop rotation plan has been saved successfully.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }, [plan, dispatch, navigation]);

  const handleReset = useCallback(() => {
    Alert.alert('Reset Plan', 'Clear all selected crops?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setPlan(createEmptyPlan());
          setActiveTemplate(null);
        },
      },
    ]);
  }, []);

  // Filter crops relevant to the selected season for the picker
  const seasonKey = SEASONS[pickerTarget.season]?.key;
  const filteredCrops = ROTATION_CROPS.filter((c) => c.season === seasonKey);
  const otherCrops = ROTATION_CROPS.filter((c) => c.season !== seasonKey);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.titlePrefix}>Crop</Text>
          <Text style={styles.titleText}> Rotation Planner</Text>
        </View>
        <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
          <MaterialCommunityIcons name="refresh" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Template Selector */}
        <Text style={styles.sectionTitle}>Quick Templates</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.templateRow}
        >
          {ROTATION_TEMPLATES.map((t, i) => (
            <TemplateCard
              key={t.name}
              template={t}
              isActive={activeTemplate === i}
              onPress={() => handleTemplatePress(t, i)}
            />
          ))}
        </ScrollView>

        {/* Rotation Grid */}
        <Text style={styles.sectionTitle}>3-Year Rotation Plan</Text>

        {/* Season column headers */}
        <View style={styles.gridHeader}>
          <View style={styles.yearLabel} />
          {SEASONS.map((s) => (
            <View key={s.key} style={styles.seasonHeader}>
              <Text style={[styles.seasonName, { color: s.color }]}>{s.label}</Text>
              <Text style={styles.seasonPeriod}>{s.period}</Text>
            </View>
          ))}
        </View>

        {/* Grid rows */}
        {plan.map((yearRow, yearIdx) => (
          <View key={yearIdx} style={styles.gridRow}>
            <View style={styles.yearLabel}>
              <Text style={styles.yearText}>Year {yearIdx + 1}</Text>
            </View>
            {yearRow.map((cropName, seasonIdx) => (
              <GridCell
                key={`${yearIdx}-${seasonIdx}`}
                cropName={cropName}
                seasonIdx={seasonIdx}
                onPress={() => handleCellPress(yearIdx, seasonIdx)}
              />
            ))}
          </View>
        ))}

        {/* Benefits */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.xxl }]}>
          Why Rotate Crops?
        </Text>
        <View style={styles.benefitsCard}>
          {BENEFITS.map((b) => (
            <BenefitItem key={b.title} benefit={b} />
          ))}
        </View>

        {/* Save button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <MaterialCommunityIcons name="content-save" size={20} color={COLORS.white} />
          <Text style={styles.saveBtnText}>Save Plan</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Crop Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + SPACING.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select Crop — {SEASONS[pickerTarget.season]?.label}
              </Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Clear option */}
            {plan[pickerTarget.year]?.[pickerTarget.season] && (
              <TouchableOpacity style={styles.clearOption} onPress={handleClearCell} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close-circle-outline" size={24} color={COLORS.danger} />
                <Text style={styles.clearText}>Remove Crop</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.pickerSectionLabel}>Recommended for {SEASONS[pickerTarget.season]?.label}</Text>
            <FlatList
              data={[...filteredCrops, ...otherCrops]}
              keyExtractor={(item) => item.name}
              renderItem={({ item, index }) => (
                <>
                  {index === filteredCrops.length && otherCrops.length > 0 && (
                    <Text style={styles.pickerSectionLabel}>Other Crops</Text>
                  )}
                  <CropPickerItem crop={item} onSelect={handleCropSelect} />
                </>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pickerList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryLight },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: { padding: SPACING.xs, marginRight: SPACING.sm },
  headerTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  titlePrefix: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white, opacity: 0.85 },
  titleText: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  resetBtn: { padding: SPACING.xs },

  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  scrollContent: { padding: SPACING.lg },

  // Templates
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  templateRow: { gap: SPACING.md, paddingBottom: SPACING.lg },
  templateCard: {
    width: 140,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  templateCardActive: { backgroundColor: COLORS.primaryLight },
  templateName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  templateNameActive: { color: COLORS.white },
  templateSub: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 2, textAlign: 'center' },
  templateSubActive: { color: 'rgba(255,255,255,0.8)' },

  // Grid
  gridHeader: { flexDirection: 'row', marginBottom: SPACING.sm },
  seasonHeader: { flex: 1, alignItems: 'center' },
  seasonName: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold },
  seasonPeriod: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  gridRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  yearLabel: { width: 52, justifyContent: 'center', alignItems: 'center' },
  yearText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textSecondary },
  gridCell: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    ...SHADOWS.sm,
  },
  cellCropName: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginTop: 4, textAlign: 'center' },
  cellFamily: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, textTransform: 'capitalize' },
  cellPlaceholder: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 4 },

  // Benefits
  benefitsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  benefitItem: { flexDirection: 'row', marginBottom: SPACING.lg },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  benefitContent: { flex: 1 },
  benefitTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  benefitDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2, lineHeight: 18 },

  // Save
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.xxl,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  saveBtnText: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '70%',
    paddingTop: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  clearOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.md,
  },
  clearText: { fontSize: FONT_SIZES.md, color: COLORS.danger, fontWeight: FONT_WEIGHTS.medium },
  pickerSectionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  pickerList: { paddingBottom: SPACING.lg },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  pickerInfo: { flex: 1 },
  pickerName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  pickerMeta: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, textTransform: 'capitalize' },
  pickerSeasonBadge: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  pickerSeasonText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold, textTransform: 'capitalize' },
});

export default CropRotationScreen;
