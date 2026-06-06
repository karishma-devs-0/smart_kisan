import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Alert,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '../../../constants/colors';
import { SPACING } from '../../../constants/spacing';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { BORDER_RADIUS, SHADOWS, SCREEN_HEADER } from '../../../constants/layout';
import {
  fetchAiConfig,
  fetchDecisionsForPump,
  submitOverride,
  submitFeedback,
} from '../slice/aiPumpSlice';
import { formatReason, isRun, isSkip } from '../utils/decisionReason';
import { formatRelativeTime } from '../../../utils/dateTime';

/**
 * AIPumpScreen — full dashboard for one pump in AI mode.
 *
 *   route.params = { pumpId }
 *
 * Sections:
 *   1. Status hero — current pump + AI mode + advisory badge
 *   2. Action buttons — Run now, Skip next, Pause AI
 *   3. Decision feed — last 20 decisions with reason + feedback thumbs
 */
export default function AIPumpScreen({ route, navigation }) {
  const { pumpId } = route.params || {};
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const config = useSelector((s) => s.aiPump.configsByPumpId[pumpId]);
  const decisions = useSelector((s) => s.aiPump.decisionsByPumpId[pumpId] || []);
  const pump = useSelector((s) => s.pumps.pumps.find((p) => p.id === pumpId));
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    if (!pumpId) return;
    await Promise.all([
      dispatch(fetchAiConfig(pumpId)),
      dispatch(fetchDecisionsForPump({ pumpId, limit: 20 })),
    ]);
  }, [pumpId, dispatch]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const latestDecision = decisions[0];
  const nextActionLine = useMemo(() => {
    if (!config?.ai_enabled) return 'AI mode is off for this pump.';
    if (!latestDecision) return 'Waiting for the first decision (within 15 minutes).';
    return formatReason(latestDecision);
  }, [config, latestDecision]);

  // ─── Overrides ───────────────────────────────────────────────────────────

  const runNow = () => {
    Alert.alert(
      'Run pump now?',
      `This will run "${pump?.name || 'this pump'}" for 10 minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run now',
          onPress: () => dispatch(submitOverride({
            pumpId,
            kind: 'run_now',
            payload: { duration_min: 10 },
          })).then(() => setTimeout(loadAll, 1500)),
        },
      ],
    );
  };

  const skipNext = () => {
    dispatch(submitOverride({ pumpId, kind: 'skip_next' }))
      .then(() => Alert.alert('Done', 'The next scheduled run will be skipped.'))
      .then(() => setTimeout(loadAll, 1500));
  };

  const pauseAi = () => {
    Alert.alert(
      'Pause AI?',
      'AI will stop running this pump for the next 24 hours. You can re-enable any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause for 24h',
          onPress: () => {
            const expires = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
            dispatch(submitOverride({
              pumpId,
              kind: 'pause_until',
              expires_at: expires,
            })).then(() => setTimeout(loadAll, 1500));
          },
        },
      ],
    );
  };

  // ─── Header (custom, since we need back + pump name) ─────────────────────

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
        <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>
          <Text style={{ fontWeight: FONT_WEIGHTS.bold }}>AI</Text>_Pump
        </Text>
        <Text style={styles.headerSub}>{pump?.name || 'Pump'}</Text>
      </View>
    </View>
  );

  // ─── Hero card ───────────────────────────────────────────────────────────

  const renderHero = () => (
    <View style={styles.heroCard}>
      <View style={styles.heroIconRow}>
        <View style={[styles.heroIcon, {
          backgroundColor: config?.ai_enabled ? COLORS.primaryLight + '20' : '#EEEEEE',
        }]}>
          <MaterialCommunityIcons
            name={config?.ai_enabled ? 'brain' : 'brain'}
            size={32}
            color={config?.ai_enabled ? COLORS.primary : COLORS.textSecondary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroLabel}>
            {config?.ai_enabled
              ? (config.ai_advisory_mode ? 'AI is advising' : 'AI is running this pump')
              : 'AI is off'}
          </Text>
          <Text style={styles.heroNext}>{nextActionLine}</Text>
        </View>
      </View>

      {/* Safety summary */}
      {config?.ai_enabled && (
        <View style={styles.safetyRow}>
          <SafetyChip
            icon="counter"
            label={`Max ${config.max_runs_per_day ?? 3}/day`}
          />
          <SafetyChip
            icon="timer-sand"
            label={`≤ ${config.max_run_minutes ?? 45} min/run`}
          />
          <SafetyChip
            icon="snowflake"
            label={`${config.cooldown_minutes ?? 90}m cooldown`}
          />
        </View>
      )}
    </View>
  );

  // ─── Action buttons ──────────────────────────────────────────────────────

  const renderActions = () => (
    <View style={styles.actionsRow}>
      <ActionButton
        icon="play"
        label="Run now"
        color={COLORS.primary}
        onPress={runNow}
        disabled={!config?.ai_enabled}
      />
      <ActionButton
        icon="skip-next"
        label="Skip next"
        color="#F59E0B"
        onPress={skipNext}
        disabled={!config?.ai_enabled}
      />
      <ActionButton
        icon="pause"
        label="Pause 24h"
        color="#6B7280"
        onPress={pauseAi}
        disabled={!config?.ai_enabled}
      />
    </View>
  );

  // ─── Decision row ────────────────────────────────────────────────────────

  const renderDecision = ({ item }) => {
    const run = isRun(item);
    return (
      <View style={styles.decisionRow}>
        <View style={[styles.decisionDot, {
          backgroundColor: run ? COLORS.primary : '#9CA3AF',
        }]} />
        <View style={{ flex: 1 }}>
          <View style={styles.decisionHeaderRow}>
            <Text style={styles.decisionActionText}>
              {run ? `RUN • ${item.duration_min} min` : 'SKIP'}
            </Text>
            <Text style={styles.decisionTime}>
              {formatRelativeTime(item.decided_at) || '—'}
            </Text>
          </View>
          <Text style={styles.decisionReason}>{formatReason(item)}</Text>
          {item.executed === false && run && (
            <Text style={styles.advisoryTag}>(advisory only)</Text>
          )}
          <View style={styles.feedbackRow}>
            <FeedbackButton
              active={item.feedback === 'good'}
              icon="thumb-up"
              onPress={() => dispatch(submitFeedback({ decisionId: item.id, feedback: 'good' }))}
            />
            <FeedbackButton
              active={item.feedback === 'bad'}
              icon="thumb-down"
              onPress={() => dispatch(submitFeedback({ decisionId: item.id, feedback: 'bad' }))}
            />
          </View>
        </View>
      </View>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  if (!pumpId) {
    return (
      <View style={styles.container}>
        <Text>Missing pumpId</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={decisions}
        keyExtractor={(d) => d.id}
        renderItem={renderDecision}
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xxl }}
        ListHeaderComponent={
          <>
            {renderHero()}
            {renderActions()}
            <Text style={styles.sectionHeader}>Recent decisions</Text>
          </>
        }
        ListEmptyComponent={
          !config ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
          ) : (
            <Text style={styles.emptyText}>
              No decisions logged yet. The engine ticks every 15 minutes once AI is on.
            </Text>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      />
    </View>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function SafetyChip({ icon, label }) {
  return (
    <View style={styles.safetyChip}>
      <MaterialCommunityIcons name={icon} size={14} color={COLORS.textSecondary} />
      <Text style={styles.safetyChipText}>{label}</Text>
    </View>
  );
}

function ActionButton({ icon, label, color, onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.actionBtn, { backgroundColor: disabled ? '#E5E7EB' : color }]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={COLORS.white} />
      <Text style={styles.actionBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function FeedbackButton({ icon, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[
      styles.fbBtn, active && styles.fbBtnActive,
    ]}>
      <MaterialCommunityIcons
        name={icon}
        size={14}
        color={active ? COLORS.primary : COLORS.textSecondary}
      />
    </TouchableOpacity>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  headerSub: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.85)',
  },

  heroCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    marginBottom: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  heroIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  heroLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroNext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    marginTop: 2,
    lineHeight: 20,
  },
  safetyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  safetyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  safetyChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  actionBtnLabel: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
  },

  sectionHeader: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  decisionRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  decisionDot: {
    width: 10, height: 10, borderRadius: 5,
    marginTop: 6,
  },
  decisionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  decisionActionText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  decisionTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  decisionReason: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    marginTop: 4,
    lineHeight: 18,
  },
  advisoryTag: {
    fontSize: FONT_SIZES.xs,
    color: '#F59E0B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  fbBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  fbBtnActive: {
    backgroundColor: COLORS.primaryLight + '30',
  },

  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.xl,
    lineHeight: 20,
  },
});
