import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { fetchFields } from '../slice/fieldsSlice';

const STAGE_COLORS = {
  seedling: COLORS.info,
  vegetative: COLORS.success,
  flowering: COLORS.warning,
  maturity: '#FF9800',
};

const STATUS_BORDER_COLORS = {
  active: COLORS.success,
  fallow: COLORS.textTertiary,
  harvested: COLORS.warning,
};

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

const StatCard = ({ label, value, icon, color }) => (
  <View style={styles.statCard}>
    <MaterialCommunityIcons name={icon} size={20} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const GrowthDotChart = ({ data }) => {
  const maxProgress = 100;
  const chartHeight = 100;
  const dotSize = 8;

  return (
    <View style={styles.dotChartCard}>
      <View style={styles.dotChartContainer}>
        {data.map((item, index) => {
          const y = chartHeight - (item.progress / maxProgress) * chartHeight;
          const nextItem = data[index + 1];

          return (
            <View key={item.week} style={styles.dotColumn}>
              {/* Line to next point */}
              {nextItem && (
                <View
                  style={[
                    styles.dotLine,
                    {
                      top: y + dotSize / 2,
                      height: 2,
                      width: '100%',
                      transform: [
                        {
                          rotate: `${Math.atan2(
                            ((nextItem.progress - item.progress) / maxProgress) * chartHeight * -1,
                            50,
                          ) * (180 / Math.PI)}deg`,
                        },
                      ],
                    },
                  ]}
                />
              )}
              {/* Dot */}
              <View
                style={[
                  styles.dot,
                  {
                    top: y,
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                  },
                ]}
              />
              {/* Label */}
              <Text style={styles.dotLabel}>{item.week}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const FieldCard = React.memo(({ field, onPress }) => {
  const stageColor = STAGE_COLORS[field.growthStage] || COLORS.textTertiary;
  const statusBorderColor = STATUS_BORDER_COLORS[field.status] || COLORS.textTertiary;

  return (
    <TouchableOpacity
      style={[styles.fieldCard, { borderLeftWidth: 4, borderLeftColor: statusBorderColor }]}
      onPress={() => onPress(field)}
      activeOpacity={0.7}
    >
      {/* Top row: name + area */}
      <View style={styles.fieldTopRow}>
        <Text style={styles.fieldName}>{field.name}</Text>
        <Text style={styles.fieldArea}>{field.area} acres</Text>
      </View>

      {/* Crop name */}
      <View style={styles.fieldCropRow}>
        <MaterialCommunityIcons name="sprout" size={16} color={COLORS.primaryLight} />
        <Text style={styles.fieldCropName}>{field.crop}</Text>
      </View>

      {/* Growth stage badge */}
      <View style={styles.fieldBadgeRow}>
        <View style={[styles.stageBadge, { backgroundColor: stageColor + '20' }]}>
          <Text style={[styles.stageBadgeText, { color: stageColor }]}>
            {field.growthStage.charAt(0).toUpperCase() + field.growthStage.slice(1)}
          </Text>
        </View>
      </View>

      {/* Growth progress bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${Math.min(field.growthProgress, 100)}%`,
              backgroundColor: stageColor,
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>{field.growthProgress}% Growth</Text>

      {/* Info row: soil + irrigation */}
      <View style={styles.fieldInfoRow}>
        <View style={styles.fieldInfoItem}>
          <MaterialCommunityIcons name="terrain" size={14} color={COLORS.textTertiary} />
          <Text style={styles.fieldInfoText}>{field.soilType}</Text>
        </View>
        <View style={styles.fieldInfoItem}>
          <MaterialCommunityIcons name="water-outline" size={14} color={COLORS.textTertiary} />
          <Text style={styles.fieldInfoText}>
            {field.irrigationType.charAt(0).toUpperCase() + field.irrigationType.slice(1)}
          </Text>
        </View>
      </View>

      {/* Irrigation dates */}
      <View style={styles.fieldIrrigationRow}>
        <View style={styles.fieldIrrigationItem}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.textTertiary} />
          <Text style={styles.fieldIrrigationLabel}>Last: </Text>
          <Text style={styles.fieldIrrigationDate}>{formatDate(field.lastIrrigation)}</Text>
        </View>
        <View style={styles.fieldIrrigationItem}>
          <MaterialCommunityIcons name="clock-fast" size={14} color={COLORS.primary} />
          <Text style={styles.fieldIrrigationLabel}>Next: </Text>
          <Text style={[styles.fieldIrrigationDate, { color: COLORS.primary }]}>
            {formatDate(field.nextIrrigation)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const MyFieldsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { fields, growthData, loading } = useSelector((state) => state.fields);

  useEffect(() => {
    dispatch(fetchFields());
  }, [dispatch]);

  const totalFields = fields.length;
  const activeFields = fields.filter((f) => f.status === 'active').length;
  const totalArea = fields.reduce((sum, f) => sum + f.area, 0).toFixed(1);

  const handleFieldPress = useCallback((field) => {
    navigation.navigate('FieldDetail', { field });
  }, [navigation]);

  const handleAddField = useCallback(() => {
    Alert.alert(
      'Add Field',
      'Field creation form will be available in a future update.',
      [{ text: 'OK' }],
    );
  }, []);

  const renderHeader = () => (
    <View>
      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Total Fields" value={totalFields} icon="land-plots" color={COLORS.primary} />
        <StatCard label="Active" value={activeFields} icon="check-circle-outline" color={COLORS.success} />
        <StatCard label="Total Area" value={`${totalArea} ac`} icon="map-outline" color={COLORS.info} />
      </View>

      {/* Growth Progress Chart */}
      <Text style={styles.sectionTitle}>Growth Progress</Text>
      <GrowthDotChart data={growthData} />

      {/* Fields list label */}
      <Text style={styles.sectionTitle}>Your Fields</Text>
    </View>
  );

  if (loading && fields.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titlePrefix}>My</Text>
        <Text style={styles.titleText}> Fields</Text>
      </View>

      {/* Field List */}
      <FlatList
        data={fields}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FieldCard field={item} onPress={handleFieldPress} />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No fields added yet</Text>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={handleAddField}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  backBtn: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  titlePrefix: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  titleText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  dotChartCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    ...SHADOWS.sm,
  },
  dotChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 130,
    alignItems: 'flex-end',
  },
  dotColumn: {
    flex: 1,
    alignItems: 'center',
    height: 120,
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
  },
  dotLine: {
    position: 'absolute',
    backgroundColor: COLORS.primaryLight + '60',
    left: '50%',
    transformOrigin: 'left center',
  },
  dotLabel: {
    position: 'absolute',
    bottom: -SPACING.sm,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  fieldCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  fieldTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  fieldName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  fieldArea: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  fieldCropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  fieldCropName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primaryLight,
    fontWeight: FONT_WEIGHTS.medium,
  },
  fieldBadgeRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  stageBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  stageBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.divider,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginBottom: SPACING.sm,
  },
  fieldInfoRow: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  fieldInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  fieldInfoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  fieldIrrigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldIrrigationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldIrrigationLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginLeft: SPACING.xs,
  },
  fieldIrrigationDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xxxl,
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
    ...SHADOWS.lg,
  },
});

export default MyFieldsScreen;
