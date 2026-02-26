import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { fetchFarmData } from '../slice/farmSlice';

const StatCard = ({ label, value, color }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const CategoryCard = ({ category, onPress }) => (
  <TouchableOpacity style={styles.categoryCard} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.categoryIconCircle, { backgroundColor: category.color + '15' }]}>
      <MaterialCommunityIcons name={category.icon} size={24} color={category.color} />
    </View>
    <Text style={styles.categoryName} numberOfLines={1}>{category.name}</Text>
    {category.count > 0 && (
      <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
        <Text style={styles.categoryBadgeText}>{category.count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const GrowthBar = ({ item, maxValue }) => {
  const barHeight = (item.growthIndex / maxValue) * 120;
  return (
    <View style={styles.growthBarWrapper}>
      <View style={styles.growthBarContainer}>
        <View
          style={[
            styles.growthBarFill,
            { height: barHeight, backgroundColor: COLORS.primary + 'CC' },
          ]}
        />
      </View>
      <Text style={styles.growthBarLabel}>{item.day}</Text>
    </View>
  );
};

const FarmManagementScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { tasks, categories, growthTrends, loading } = useSelector((state) => state.farm);

  useEffect(() => {
    dispatch(fetchFarmData());
  }, [dispatch]);

  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((t) => t.status === 'active').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const maxGrowth = Math.max(...growthTrends.map((t) => t.growthIndex), 100);

  if (loading && tasks.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.titlePrefix}>Farm</Text>
          <Text style={styles.titleText}> Management</Text>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Total Tasks" value={totalTasks} color={COLORS.primary} />
          <StatCard label="Active" value={activeTasks} color={COLORS.success} />
          <StatCard label="Completed" value={completedTasks} color={COLORS.info} />
        </View>

        {/* Categories Grid */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => navigation.navigate('ActiveTasks')}
            />
          ))}
        </View>

        {/* Growth Trends */}
        <Text style={styles.sectionTitle}>Growth Trends</Text>
        <View style={styles.growthChartCard}>
          <View style={styles.growthChartRow}>
            {growthTrends.map((item) => (
              <GrowthBar key={item.day} item={item} maxValue={maxGrowth} />
            ))}
          </View>
        </View>

        {/* Active Tasks Button */}
        <TouchableOpacity
          style={styles.activeTasksCard}
          onPress={() => navigation.navigate('ActiveTasks')}
          activeOpacity={0.7}
        >
          <View style={styles.activeTasksLeft}>
            <View style={styles.activeTasksIconContainer}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={28} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.activeTasksTitle}>Active Tasks</Text>
              <Text style={styles.activeTasksSubtitle}>
                {activeTasks} task{activeTasks !== 1 ? 's' : ''} require attention
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
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
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  categoryCard: {
    width: '22.5%',
    flexGrow: 1,
    flexBasis: '22%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  categoryName: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  categoryBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  growthChartCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    ...SHADOWS.sm,
  },
  growthChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  growthBarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  growthBarContainer: {
    width: 24,
    height: 120,
    backgroundColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.xs,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  growthBarFill: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xs,
  },
  growthBarLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  activeTasksCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  activeTasksLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeTasksIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  activeTasksTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  activeTasksSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default FarmManagementScreen;
