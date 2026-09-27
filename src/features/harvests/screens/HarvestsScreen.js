/**
 * Harvest records and yield history.
 *
 * Nothing in the app recorded what actually came off the field, which is why
 * the harvest report showed the same efficiency figure to every farmer and
 * yield prediction had nothing behind it. This is where a farmer records it.
 *
 * Yield per acre rather than total is what the summary leads on: a farmer
 * compares seasons by yield, and two fields of different sizes are otherwise
 * not comparable.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';
import RecordHarvestModal from '../components/RecordHarvestModal';
import {
  fetchHarvests,
  fetchYieldSummary,
  recordHarvest,
  deleteHarvest,
} from '../slice/harvestsSlice';

const QUALITY_COLOURS = {
  premium: COLORS.success,
  good: COLORS.primaryLight,
  average: COLORS.warning,
  poor: COLORS.danger,
};

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
};

const YieldCard = ({ crop }) => {
  const change = crop.changeVsAverage;
  // Only shown once there are at least two seasons of a crop; before that
  // there is no average to be above or below.
  const showChange = change !== null && change !== undefined;
  const up = showChange && change > 0;

  return (
    <View style={styles.yieldCard}>
      <Text style={styles.yieldCrop}>{crop.cropName}</Text>
      <View style={styles.yieldRow}>
        <Text style={styles.yieldValue}>{crop.avgYieldPerAcre}</Text>
        <Text style={styles.yieldUnit}>qtl/acre avg</Text>
      </View>
      <Text style={styles.yieldMeta}>
        {crop.harvests} harvest{crop.harvests === 1 ? '' : 's'}
        {crop.harvests > 1 ? ` · best ${crop.bestYieldPerAcre}` : ''}
      </Text>
      {showChange && (
        <View style={styles.changeRow}>
          <MaterialCommunityIcons
            name={up ? 'trending-up' : 'trending-down'}
            size={14}
            color={up ? COLORS.success : COLORS.danger}
          />
          <Text style={[styles.changeText, { color: up ? COLORS.success : COLORS.danger }]}>
            {up ? '+' : ''}{change}% vs your average
          </Text>
        </View>
      )}
    </View>
  );
};

const HarvestRow = ({ harvest, onDelete }) => (
  <View style={styles.card}>
    <View style={styles.cardTop}>
      <View style={styles.cardTitleWrap}>
        <Text style={styles.cardTitle}>{harvest.cropName}</Text>
        {!!harvest.variety && <Text style={styles.cardSub}>{harvest.variety}</Text>}
      </View>
      <TouchableOpacity
        onPress={() => onDelete(harvest)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>
    </View>

    <View style={styles.figures}>
      <View style={styles.figure}>
        <Text style={styles.figureValue}>{harvest.quantity}</Text>
        <Text style={styles.figureLabel}>{harvest.unit}</Text>
      </View>
      {harvest.yieldPerAcre != null && (
        <>
          <View style={styles.figureDivider} />
          <View style={styles.figure}>
            <Text style={styles.figureValue}>{Number(harvest.yieldPerAcre).toFixed(1)}</Text>
            <Text style={styles.figureLabel}>qtl/acre</Text>
          </View>
        </>
      )}
    </View>

    <View style={styles.metaRow}>
      <MaterialCommunityIcons name="calendar" size={13} color={COLORS.textTertiary} />
      <Text style={styles.metaText}>{formatDate(harvest.harvestedOn)}</Text>
      {!!harvest.fieldName && (
        <>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={13}
            color={COLORS.textTertiary}
            style={{ marginLeft: SPACING.md }}
          />
          <Text style={styles.metaText}>{harvest.fieldName}</Text>
        </>
      )}
      {!!harvest.quality && (
        <View
          style={[
            styles.qualityBadge,
            { backgroundColor: (QUALITY_COLOURS[harvest.quality] || COLORS.textTertiary) + '22' },
          ]}
        >
          <Text
            style={[
              styles.qualityText,
              { color: QUALITY_COLOURS[harvest.quality] || COLORS.textTertiary },
            ]}
          >
            {harvest.quality}
          </Text>
        </View>
      )}
    </View>
  </View>
);

const HarvestsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const { harvests, yieldByCrop, enoughForTrend, loading, saving } = useSelector(
    (s) => s.harvests,
  );
  const crops = useSelector((s) => s.crops?.crops || []);
  const fields = useSelector((s) => s.fields?.fields || []);

  const [showAdd, setShowAdd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    dispatch(fetchHarvests());
    dispatch(fetchYieldSummary());
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    setTimeout(() => setRefreshing(false), 800);
  }, [load]);

  const handleCreate = useCallback(async (harvest) => {
    try {
      await dispatch(recordHarvest(harvest)).unwrap();
      setShowAdd(false);
    } catch (err) {
      Alert.alert(t('common.error'), err || 'Could not record the harvest.');
    }
  }, [dispatch, t]);

  const handleDelete = useCallback((harvest) => {
    Alert.alert(
      t('harvests.deleteTitle', 'Delete this record?'),
      t('harvests.deleteMsg', 'The yield figures will be worked out again without it.'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: () => dispatch(deleteHarvest(harvest.id)),
        },
      ],
    );
  }, [dispatch, t]);

  const renderEmpty = () => (
    <View style={styles.empty}>
      <MaterialCommunityIcons name="barley" size={60} color={COLORS.textTertiary} />
      <Text style={styles.emptyTitle}>
        {t('harvests.noneTitle', 'No harvests recorded yet')}
      </Text>
      <Text style={styles.emptyText}>
        {t(
          'harvests.noneText',
          'Record what comes off each field and the app can show how your '
          + 'yields change from season to season, and how each harvest '
          + 'compared with what you expected.',
        )}
      </Text>
    </View>
  );

  const renderHeader = () => {
    if (!yieldByCrop.length) return null;
    return (
      <View style={styles.headerBlock}>
        <Text style={styles.sectionTitle}>
          {t('harvests.yourYields', 'Your yields')}
        </Text>
        <FlatList
          data={yieldByCrop}
          keyExtractor={(c) => c.cropName}
          renderItem={({ item }) => <YieldCard crop={item} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: SPACING.lg }}
        />
        {!enoughForTrend && (
          <Text style={styles.trendNote}>
            {t(
              'harvests.trendNote',
              'One season of each crop so far. After a second the app can show '
              + 'whether a harvest was better or worse than usual.',
            )}
          </Text>
        )}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>
          {t('harvests.records', 'Records')}
        </Text>
      </View>
    );
  };

  return (
    <ScreenLayout
      title={t('harvests.title', 'Harvests')}
      showBack
      onBack={() => navigation.goBack()}
    >
      {loading && !harvests.length ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xxxl }} />
      ) : (
        <FlatList
          data={harvests}
          keyExtractor={(h) => h.id}
          renderItem={({ item }) => <HarvestRow harvest={item} onDelete={handleDelete} />}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => setShowAdd(true)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.white} />
      </TouchableOpacity>

      <RecordHarvestModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={handleCreate}
        saving={saving}
        crops={crops}
        fields={fields}
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  headerBlock: { marginBottom: SPACING.md },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  yieldCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginRight: SPACING.md,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  yieldCrop: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  yieldRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  yieldValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  yieldUnit: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  yieldMeta: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 2 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.sm },
  changeText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.medium },
  trendNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.md,
    lineHeight: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleWrap: { flex: 1 },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  cardSub: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  figures: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.md },
  figure: { alignItems: 'flex-start' },
  figureValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  figureLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  figureDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#EEEEEE',
    marginHorizontal: SPACING.xl,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  qualityBadge: {
    marginLeft: 'auto',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  qualityText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.medium },
  empty: { alignItems: 'center', paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});

export default HarvestsScreen;
