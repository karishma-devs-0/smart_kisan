import React, { useEffect, useState, useCallback } from 'react';
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
import { fetchFarmData } from '../slice/farmSlice';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
];

const PRIORITY_COLORS = {
  high: COLORS.danger,
  medium: COLORS.warning,
  low: COLORS.success,
};

const STATUS_COLORS = {
  active: COLORS.success,
  pending: COLORS.warning,
  completed: COLORS.textTertiary,
};

const CATEGORY_ICONS = {
  sowing: 'seed',
  harvesting: 'basket',
  irrigation: 'water',
  fertilizing: 'flask',
  spraying: 'spray',
  weeding: 'grass',
  monitoring: 'eye',
  maintenance: 'wrench',
};

const CATEGORY_COLORS = {
  sowing: '#4CAF50',
  harvesting: '#FF9800',
  irrigation: '#2196F3',
  fertilizing: '#9C27B0',
  spraying: '#F44336',
  weeding: '#795548',
  monitoring: '#607D8B',
  maintenance: '#FF5722',
};

const formatDueDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

const FilterPill = ({ filter, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.filterPill, isActive && styles.filterPillActive]}
    onPress={() => onPress(filter.id)}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
      {filter.label}
    </Text>
  </TouchableOpacity>
);

const TaskCard = React.memo(({ task }) => {
  const priorityColor = PRIORITY_COLORS[task.priority] || COLORS.textTertiary;
  const statusColor = STATUS_COLORS[task.status] || COLORS.textTertiary;
  const categoryIcon = CATEGORY_ICONS[task.category] || 'clipboard-text';
  const categoryColor = CATEGORY_COLORS[task.category] || COLORS.textTertiary;

  return (
    <View style={styles.taskCard}>
      {/* Left priority strip */}
      <View style={[styles.priorityStrip, { backgroundColor: priorityColor }]} />

      <View style={styles.taskCardContent}>
        {/* Top row: icon + title + status */}
        <View style={styles.taskTopRow}>
          <View style={[styles.categoryIconCircle, { backgroundColor: categoryColor + '15' }]}>
            <MaterialCommunityIcons name={categoryIcon} size={20} color={categoryColor} />
          </View>
          <View style={styles.taskTitleContainer}>
            <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
            <Text style={styles.taskDescription} numberOfLines={1}>{task.description}</Text>
          </View>
        </View>

        {/* Field name */}
        <View style={styles.taskFieldRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.textTertiary} />
          <Text style={styles.taskFieldName}>{task.fieldName}</Text>
        </View>

        {/* Bottom row: badges and meta */}
        <View style={styles.taskBottomRow}>
          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </Text>
          </View>

          {/* Priority badge */}
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
            <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Text>
          </View>

          <View style={styles.taskMetaSpacer} />

          {/* Due date */}
          <View style={styles.taskDueDateRow}>
            <MaterialCommunityIcons name="calendar-outline" size={14} color={COLORS.textTertiary} />
            <Text style={styles.taskDueDate}>{formatDueDate(task.dueDate)}</Text>
          </View>
        </View>

        {/* Assignee */}
        <View style={styles.taskAssigneeRow}>
          <MaterialCommunityIcons name="account-outline" size={14} color={COLORS.textTertiary} />
          <Text style={styles.taskAssignee}>{task.assignee}</Text>
        </View>
      </View>
    </View>
  );
});

const ActiveTasksScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { tasks, loading } = useSelector((state) => state.farm);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (tasks.length === 0) {
      dispatch(fetchFarmData());
    }
  }, [dispatch, tasks.length]);

  const filteredTasks = activeFilter === 'all'
    ? tasks
    : tasks.filter((t) => t.status === activeFilter);

  const handleAddTask = useCallback(() => {
    Alert.alert(
      'Add Task',
      'Task creation form will be available in a future update.',
      [{ text: 'OK' }],
    );
  }, []);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={COLORS.textTertiary} />
      <Text style={styles.emptyTitle}>No Tasks Found</Text>
      <Text style={styles.emptySubtitle}>
        No tasks match the selected filter. Try a different filter or add a new task.
      </Text>
    </View>
  );

  if (loading && tasks.length === 0) {
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
        <Text style={styles.titlePrefix}>Active</Text>
        <Text style={styles.titleText}> Tasks</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <FlatList
          data={FILTERS}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <FilterPill
              filter={item}
              isActive={activeFilter === item.id}
              onPress={setActiveFilter}
            />
          )}
        />
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskCard task={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={handleAddTask}
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
  filterRow: {
    marginBottom: SPACING.md,
  },
  filterContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterPill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  filterPillTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  priorityStrip: {
    width: 4,
  },
  taskCardContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  taskTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  taskTitleContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  taskDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  taskFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  taskFieldName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
  },
  taskBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  priorityBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  taskMetaSpacer: {
    flex: 1,
  },
  taskDueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  taskDueDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  taskAssigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  taskAssignee: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xxxl,
    lineHeight: 22,
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

export default ActiveTasksScreen;
