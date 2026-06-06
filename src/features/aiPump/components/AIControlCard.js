import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS } from '../../../constants/colors';
import { SPACING } from '../../../constants/spacing';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import {
  fetchAiConfig,
  updateAiConfig,
} from '../slice/aiPumpSlice';
import { formatReason } from '../utils/decisionReason';

// Stable reference for the "no decisions yet" case — returning a fresh `[]`
// from the selector every render triggers a Redux rerender warning.
const EMPTY_DECISIONS = [];

/**
 * Compact card for PumpDetailScreen — shows AI status, lets the farmer toggle
 * AI mode, and previews the most recent decision. "View details" pushes to
 * AIPumpScreen for the full feed and overrides.
 */
export default function AIControlCard({ pumpId, navigation }) {
  const dispatch = useDispatch();
  const config = useSelector((s) => s.aiPump.configsByPumpId[pumpId]);
  const decisions = useSelector((s) => s.aiPump.decisionsByPumpId[pumpId] || EMPTY_DECISIONS);
  const saving = useSelector((s) => s.aiPump.saving);
  const error = useSelector((s) => s.aiPump.error);
  // Local pump record from Redux — has flowRate that the user entered in
  // EditPumpScreen but may not yet be persisted to the backend. We sync it
  // into the backend config the first time AI is toggled.
  const localPump = useSelector((s) => s.pumps.pumps.find((p) => p.id === pumpId));
  const [enabling, setEnabling] = useState(false);
  // We use this to differentiate "still loading" from "loaded but no row" —
  // the API can return 404 for pumps that aren't in the new schema yet.
  const [loadAttempted, setLoadAttempted] = useState(false);

  useEffect(() => {
    if (pumpId) {
      dispatch(fetchAiConfig(pumpId)).finally(() => setLoadAttempted(true));
    }
  }, [pumpId, dispatch]);

  const latest = decisions[0];

  const handleToggle = async (value) => {
    setEnabling(true);
    try {
      const patch = { ai_enabled: value };
      // First-time enable: make sure the backend has SOME flow_rate so the
      // engine can compute durations and the dashboard can show litres.
      // Priority: backend value > local pump > 50 L/min default.
      // Without this, mock pumps (no flowRate in mock data) leave litres
      // blank in the decision detail modal.
      if (value && !config?.flow_rate) {
        const localFlow = Number(localPump?.flowRate ?? localPump?.flow_rate);
        patch.flow_rate = Number.isFinite(localFlow) && localFlow > 0 ? localFlow : 50;
      }
      await dispatch(updateAiConfig({ pumpId, patch })).unwrap();
    } catch (err) {
      Alert.alert('Could not update', String(err));
    } finally {
      setEnabling(false);
    }
  };

  const handleAdvisoryToggle = async (value) => {
    try {
      await dispatch(updateAiConfig({
        pumpId,
        patch: { ai_advisory_mode: value },
      })).unwrap();
    } catch (err) {
      Alert.alert('Could not update', err);
    }
  };

  if (!config) {
    // Still loading — show a small spinner with context.
    if (!loadAttempted) {
      return (
        <View style={styles.card}>
          <View style={styles.loadingRow}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading AI Control…</Text>
          </View>
        </View>
      );
    }
    // Backend unreachable or pump not yet in new schema — give clear hint.
    return (
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="brain" size={22} color={COLORS.textSecondary} />
          <Text style={[styles.title, { color: COLORS.textSecondary }]}>AI Control</Text>
        </View>
        <Text style={styles.errorHint}>
          Couldn't reach the AI Pump service{error ? ` (${error})` : ''}. Make sure the
          backend is running and the phone is on the same network.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="brain" size={22} color={COLORS.primary} />
          <Text style={styles.title}>AI Control</Text>
        </View>
        <Switch
          value={!!config.ai_enabled}
          onValueChange={handleToggle}
          disabled={enabling || saving}
          trackColor={{ false: '#D0D0D0', true: COLORS.primaryLight }}
          thumbColor="#FFFFFF"
        />
      </View>

      {config.ai_enabled ? (
        <>
          <View style={styles.advisoryRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.advisoryLabel}>Advisory mode</Text>
              <Text style={styles.advisoryHint}>
                {config.ai_advisory_mode
                  ? 'AI suggests but never runs the pump on its own.'
                  : 'AI runs the pump automatically when conditions match.'}
              </Text>
            </View>
            <Switch
              value={!!config.ai_advisory_mode}
              onValueChange={handleAdvisoryToggle}
              trackColor={{ false: '#D0D0D0', true: COLORS.primaryLight }}
              thumbColor="#FFFFFF"
            />
          </View>

          {latest ? (
            <View style={styles.latestBox}>
              <Text style={styles.latestLabel}>Latest decision</Text>
              <Text style={styles.latestText}>{formatReason(latest)}</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              No decisions yet — first run within 15 minutes.
            </Text>
          )}

          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() => navigation.navigate('AIPump', { pumpId })}
          >
            <Text style={styles.detailsBtnText}>View AI dashboard</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.disabledHint}>
          When enabled, the AI uses soil moisture, weather, and crop stage to
          decide when to run this pump.
        </Text>
      )}
    </View>
  );
}

// (canEnable check removed — engine has sensible defaults for missing crop /
// field / flow_rate; the toggle should never be silently blocked.)

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  advisoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  advisoryLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
  },
  advisoryHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginRight: SPACING.sm,
  },
  latestBox: {
    backgroundColor: '#F5F7F4',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  latestLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  latestText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  detailsBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  disabledHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  errorHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
});
