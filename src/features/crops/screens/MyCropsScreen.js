import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { fetchCrops, deleteCrop } from '../slice/cropsSlice';
import { computeStage, computeProgress, harvestLabel } from '../utils/growthStages';
import { useTranslation } from 'react-i18next';

const statusColors = { growing: COLORS.success, ready: COLORS.warning, harvested: COLORS.info };
const stageColors = {
  seedling: COLORS.info,
  vegetative: COLORS.success,
  flowering: COLORS.warning,
  maturity: '#FF9800',
};

const CropItem = React.memo(({ crop, onPress }) => {
  const stage = crop.status === 'harvested' ? 'harvested' : computeStage(crop.sowingDate, crop.name);
  const progress = crop.status === 'harvested' ? 100 : computeProgress(crop.sowingDate, crop.name);
  const stageColor = stageColors[stage] || COLORS.textTertiary;
  const harvest = crop.status === 'harvested' ? 'Harvested' : harvestLabel(crop.sowingDate, crop.name);

  return (
    <TouchableOpacity style={styles.cropCard} onPress={() => onPress(crop)} activeOpacity={0.7}>
      <View style={styles.cropImage}>
        <MaterialCommunityIcons name="sprout" size={40} color={COLORS.primaryLight} />
      </View>
      <Text style={styles.cropName} numberOfLines={1}>{crop.name}</Text>
      <Text style={styles.cropVariety} numberOfLines={1}>{crop.variety}</Text>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: stageColor }]} />
      </View>
      <Text style={[styles.stageText, { color: stageColor }]} numberOfLines={1}>
        {stage.charAt(0).toUpperCase() + stage.slice(1)} · {progress}%
      </Text>
      <Text style={styles.harvestText} numberOfLines={1}>{harvest}</Text>
    </TouchableOpacity>
  );
});

const MyCropsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { crops } = useSelector((s) => s.crops);

  useEffect(() => { dispatch(fetchCrops()); }, [dispatch]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titlePrefix}>{t('crops.myPrefix')}</Text>
        <Text style={styles.titleText}> {t('crops.title')}</Text>
      </View>
      {/* Crop Rotation Planner Entry */}
      <TouchableOpacity
        style={styles.rotationCard}
        onPress={() => navigation.navigate('CropRotation')}
        activeOpacity={0.7}
      >
        <View style={styles.rotationIconWrap}>
          <MaterialCommunityIcons name="rotate-3d-variant" size={28} color={COLORS.primaryLight} />
        </View>
        <View style={styles.rotationInfo}>
          <Text style={styles.rotationTitle}>Crop Rotation Planner</Text>
          <Text style={styles.rotationSubtitle}>Plan 3-year seasonal rotations</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textTertiary} />
      </TouchableOpacity>

      <FlatList
        data={crops}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CropItem crop={item} onPress={(crop) => Alert.alert(
          crop.name,
          `Variety: ${crop.variety}\nSowing Date: ${crop.sowingDate}\nStatus: ${crop.status}`,
          [
            { text: 'Close', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                Alert.alert('Delete Crop', `Remove ${crop.name}?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteCrop(crop.id)) },
                ]);
              },
            },
          ],
        )} />}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="sprout-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Crops Yet</Text>
            <Text style={styles.emptySubtitle}>Add your crops to track growth and health</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddCrop')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Add Crop</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 20 }]} onPress={() => navigation.navigate('AddCrop')}>
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  titlePrefix: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  titleText: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  rotationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  rotationIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  rotationInfo: { flex: 1 },
  rotationTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  rotationSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  listContent: { padding: SPACING.lg, paddingBottom: 100 },
  row: { gap: SPACING.md },
  cropCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.sm },
  cropImage: { width: '100%', height: 80, backgroundColor: COLORS.primarySurface, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  cropName: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  cropVariety: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  cropDate: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 4 },
  statusBadge: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2, alignSelf: 'flex-start', marginTop: SPACING.sm },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold, textTransform: 'capitalize' },
  progressBarBg: { height: 6, backgroundColor: COLORS.divider, borderRadius: 3, overflow: 'hidden', marginTop: SPACING.sm },
  progressBarFill: { height: '100%', borderRadius: 3 },
  stageText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold, marginTop: SPACING.xs },
  harvestText: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 2 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxxl },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginTop: SPACING.lg },
  emptySubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, marginHorizontal: SPACING.xl },
  emptyButton: { backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md, marginTop: SPACING.xl },
  emptyButtonText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
  fab: { position: 'absolute', right: SPACING.xl, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.lg },
});

export default MyCropsScreen;
