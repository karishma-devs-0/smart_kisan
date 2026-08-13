/**
 * AI Field Monitor — on-device weed and crop-stress detection.
 *
 * This screen previously animated a pole-mounted camera rig and generated its
 * "detections" with Math.random(): random species, random 75-95% confidence,
 * plotted at random offsets. The hardware it depicted does not exist. All of
 * that is gone; every result below comes from a real model running on the
 * device.
 *
 *   GOG  Green-on-Green   — which weed species is in the frame
 *   YOG  Yellow-on-Green  — whether the canopy is healthy, chlorotic or stressed
 *
 * Both models are bundled in the APK (2.4 MB each) and run offline, which is
 * the point: a farmer standing in a field usually has no usable signal.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import ScreenLayout from '../../../components/common/ScreenLayout';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { classify, preloadModels } from '../../../services/weedInference';

const MODES = [
  {
    id: 'gog',
    icon: 'sprout',
    title: 'Green-on-Green',
    subtitle: 'Identify weeds in the crop',
    color: '#D32F2F',
  },
  {
    id: 'yog',
    icon: 'leaf',
    title: 'Yellow-on-Green',
    subtitle: 'Detect canopy stress',
    color: '#FFB300',
  },
];

// A prediction below this is reported but explicitly marked uncertain. The
// models return a softmax, so they always name something — the score is the
// only signal separating a real call from a guess.
const LOW_CONFIDENCE = 60;

// Scan history is worth keeping between sessions — a farmer comparing today's
// canopy against last week's is the point of recording it at all. Capped so the
// stored image URIs cannot grow without bound.
const HISTORY_KEY = '@smartkisan:weedScans';
const HISTORY_LIMIT = 10;

const WeedDetectionHomeScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [mode, setMode] = useState('gog');
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Loading a model costs a disk read; doing it on screen open means the
    // first scan is no slower than the rest.
    preloadModels().then(setModelReady);

    AsyncStorage.getItem(HISTORY_KEY)
      .then((raw) => {
        if (raw) setHistory(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const rememberScan = useCallback((entry) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, HISTORY_LIMIT);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const runScan = useCallback(
    async (useCamera) => {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert(
          t('common.permissionNeeded', 'Permission needed'),
          useCamera
            ? t('weedDetection.cameraPermission', 'Camera access is needed to scan the field.')
            : t('weedDetection.galleryPermission', 'Photo access is needed to pick an image.')
        );
        return;
      }

      const picked = useCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.9, allowsEditing: true, aspect: [1, 1] })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.9, allowsEditing: true, aspect: [1, 1] });

      if (picked.canceled || !picked.assets?.[0]) return;

      const uri = picked.assets[0].uri;
      setImage(uri);
      setResult(null);
      setBusy(true);

      try {
        const prediction = await classify(mode, uri);
        setResult(prediction);
        rememberScan({ uri, mode, ...prediction, at: Date.now() });
      } catch (error) {
        // A failed scan reports the failure. It does not invent a species —
        // acting on a fabricated weed identification means spraying the wrong
        // chemical.
        if (__DEV__) console.warn('Weed scan failed:', error);
        Alert.alert(
          t('weedDetection.scanFailed', 'Scan failed'),
          error?.message || t('weedDetection.scanFailedBody', 'Could not analyse the image. Please try again.')
        );
      } finally {
        setBusy(false);
      }
    },
    [mode, t, rememberScan]
  );

  const activeMode = MODES.find((m) => m.id === mode);

  const renderResult = () => {
    if (!result) return null;

    const uncertain = result.confidence < LOW_CONFIDENCE;
    const clear = result.isNegative;
    const accent = clear ? COLORS.success : uncertain ? '#F57C00' : activeMode.color;

    return (
      <View style={[styles.resultCard, { borderLeftColor: accent }]}>
        <View style={styles.resultHeader}>
          <View style={styles.resultText}>
            <Text style={styles.resultLabelSmall}>
              {clear
                ? mode === 'gog'
                  ? t('weedDetection.noWeed', 'No weed detected')
                  : t('weedDetection.canopyHealthy', 'Canopy looks healthy')
                : t('weedDetection.detected', 'Detected')}
            </Text>
            <Text style={[styles.resultLabel, { color: accent }]}>{result.label}</Text>
          </View>
          <View style={styles.confidenceWrap}>
            <Text style={[styles.confidenceValue, { color: accent }]}>{result.confidence}%</Text>
            <Text style={styles.confidenceCaption}>
              {t('weedDetection.confidence', 'Confidence')}
            </Text>
          </View>
        </View>

        {uncertain && (
          <View style={styles.uncertainNote}>
            <MaterialCommunityIcons name="alert-outline" size={16} color="#E65100" />
            <Text style={styles.uncertainText}>
              {t(
                'weedDetection.lowConfidence',
                'Low confidence — take a closer, well-lit photo before acting on this.'
              )}
            </Text>
          </View>
        )}

        {result.top3?.length > 1 && (
          <View style={styles.top3}>
            <Text style={styles.top3Title}>{t('weedDetection.alternatives', 'Other possibilities')}</Text>
            {result.top3.slice(1).map((alt) => (
              <View key={alt.label} style={styles.top3Row}>
                <Text style={styles.top3Label}>{alt.label}</Text>
                <Text style={styles.top3Conf}>{alt.confidence}%</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenLayout
      title={t('weedDetection.title', 'AI Field Monitor')}
      showBack
      onBack={() => navigation.goBack()}
      scrollable={false}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {/* Mode selector */}
        <View style={styles.modeRow}>
          {MODES.map((m) => {
            const active = m.id === mode;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.modeCard, active && { borderColor: m.color, backgroundColor: '#FAFAFA' }]}
                onPress={() => {
                  setMode(m.id);
                  setResult(null);
                }}
              >
                <MaterialCommunityIcons
                  name={m.icon}
                  size={22}
                  color={active ? m.color : COLORS.textTertiary}
                />
                <Text style={[styles.modeTitle, active && { color: m.color }]}>{m.title}</Text>
                <Text style={styles.modeSubtitle}>{m.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Preview */}
        <View style={styles.previewBox}>
          {image ? (
            <Image source={{ uri: image }} style={styles.preview} />
          ) : (
            <View style={styles.previewEmpty}>
              <MaterialCommunityIcons name="image-search-outline" size={44} color={COLORS.textTertiary} />
              <Text style={styles.previewHint}>
                {t('weedDetection.previewHint', 'Photograph the crop canopy to scan it')}
              </Text>
            </View>
          )}
          {busy && (
            <View style={styles.busyOverlay}>
              <ActivityIndicator color={COLORS.white} size="large" />
              <Text style={styles.busyText}>{t('weedDetection.analysing', 'Analysing…')}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionPrimary]}
            onPress={() => runScan(true)}
            disabled={busy}
          >
            <MaterialCommunityIcons name="camera" size={20} color={COLORS.white} />
            <Text style={styles.actionPrimaryText}>{t('weedDetection.scan', 'Scan field')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionSecondary]}
            onPress={() => runScan(false)}
            disabled={busy}
          >
            <MaterialCommunityIcons name="image-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionSecondaryText}>{t('weedDetection.gallery', 'Gallery')}</Text>
          </TouchableOpacity>
        </View>

        {renderResult()}

        {/* Recent scans */}
        {history.length > 0 && (
          <View style={styles.historyBlock}>
            <Text style={styles.sectionTitle}>{t('weedDetection.recent', 'Recent scans')}</Text>
            {history.map((h) => (
              <View key={h.at} style={styles.historyRow}>
                <Image source={{ uri: h.uri }} style={styles.historyThumb} />
                <View style={styles.historyBody}>
                  <Text style={styles.historyLabel}>{h.label}</Text>
                  <Text style={styles.historyMeta}>
                    {h.mode.toUpperCase()} · {h.confidence}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Where the numbers come from. The models are trained on public
            datasets that do not match Indian field conditions, and a farmer
            deciding whether to spray deserves to know that. */}
        <View style={styles.disclosure}>
          <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.disclosureText}>
            {t(
              'weedDetection.modelNote',
              'Runs offline on this device. Weed identification is trained on UAV imagery of a cotton field (CoFly) on top of a DeepWeeds backbone; canopy stress is trained on PlantVillage. Neither is validated on Indian field conditions yet, so treat low-confidence results as a prompt to inspect, not a diagnosis.'
            )}
          </Text>
        </View>

        {!modelReady && (
          <Text style={styles.loadingNote}>
            {t('weedDetection.loadingModels', 'Loading detection models…')}
          </Text>
        )}
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  body: { paddingBottom: SPACING.xxxxl },

  modeRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  modeCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  modeTitle: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  modeSubtitle: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },

  previewBox: {
    height: 260,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    marginBottom: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: { width: '100%', height: '100%', resizeMode: 'cover' },
  previewEmpty: { alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.xl },
  previewHint: { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, textAlign: 'center' },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  busyText: { color: COLORS.white, fontSize: FONT_SIZES.sm },

  actionRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  actionPrimary: { backgroundColor: COLORS.primary },
  actionPrimaryText: { color: COLORS.white, fontWeight: FONT_WEIGHTS.semiBold },
  actionSecondary: { borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.white },
  actionSecondaryText: { color: COLORS.primary, fontWeight: FONT_WEIGHTS.semiBold },

  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderLeftWidth: 4,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center' },
  resultText: { flex: 1 },
  resultLabelSmall: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  resultLabel: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, marginTop: 2 },
  confidenceWrap: { alignItems: 'center' },
  confidenceValue: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold },
  confidenceCaption: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },

  uncertainNote: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#FFF3E0',
  },
  uncertainText: { flex: 1, fontSize: FONT_SIZES.xs, color: '#E65100', lineHeight: 16 },

  top3: { marginTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md },
  top3Title: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  top3Row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  top3Label: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary },
  top3Conf: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  historyBlock: { marginBottom: SPACING.lg },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  historyThumb: { width: 44, height: 44, borderRadius: BORDER_RADIUS.sm },
  historyBody: { flex: 1 },
  historyLabel: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  historyMeta: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },

  disclosure: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  disclosureText: { flex: 1, fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, lineHeight: 16 },

  loadingNote: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});

export default WeedDetectionHomeScreen;
