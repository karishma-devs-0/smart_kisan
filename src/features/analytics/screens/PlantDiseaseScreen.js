import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { useTranslation } from 'react-i18next';
import { HUGGINGFACE_SPACE_URL } from '../../../config/firebase.config';

const API_URL = `${HUGGINGFACE_SPACE_URL}/predict`;

const getHowItWorksSteps = (t) => [
  { step: 1, icon: 'camera', title: t('plantDisease.step1Title'), description: t('plantDisease.step1Desc') },
  { step: 2, icon: 'brain', title: t('plantDisease.step2Title'), description: t('plantDisease.step2Desc') },
  { step: 3, icon: 'clipboard-check', title: t('plantDisease.step3Title'), description: t('plantDisease.step3Desc') },
];

const StepCard = ({ step }) => (
  <View style={styles.stepCard}>
    <View style={styles.stepNumberContainer}>
      <Text style={styles.stepNumber}>{step.step}</Text>
    </View>
    <View style={styles.stepContent}>
      <View style={styles.stepIconRow}>
        <MaterialCommunityIcons name={step.icon} size={20} color={COLORS.primary} />
        <Text style={styles.stepTitle}>{step.title}</Text>
      </View>
      <Text style={styles.stepDescription}>{step.description}</Text>
    </View>
  </View>
);

const PlantDiseaseScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  const pickImage = useCallback(async (useCamera) => {
    const permissionMethod = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await permissionMethod();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', `Please grant ${useCamera ? 'camera' : 'gallery'} access to scan leaves.`);
      return;
    }

    const launchMethod = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const pickerResult = await launchMethod({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!pickerResult.canceled && pickerResult.assets?.[0]) {
      const uri = pickerResult.assets[0].uri;
      setImageUri(uri);
      setResult(null);
      analyzeImage(uri);
    }
  }, []);

  const analyzeImage = async (uri) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'leaf.jpg',
        type: 'image/jpeg',
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      setResult(data);

      // Add to scan history
      setScanHistory((prev) => [{
        id: Date.now().toString(),
        cropName: data.crop,
        diseaseName: data.disease,
        confidence: data.confidence,
        date: new Date().toISOString().split('T')[0],
        status: data.is_healthy ? 'healthy' : 'diseased',
        treatment: data.treatment,
      }, ...prev].slice(0, 10));
    } catch (error) {
      Alert.alert('Analysis Failed', 'Could not connect to the AI server. Make sure you have internet access and the API is deployed.\n\nUpdate API_URL in PlantDiseaseScreen.js after deploying to Hugging Face.');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = result ? (result.is_healthy ? COLORS.success : COLORS.danger) : COLORS.textTertiary;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titlePrefix}>{t('plantDisease.prefix')}</Text>
        <Text style={styles.titleText}> {t('plantDisease.title')}</Text>
      </View>

      {/* Image Preview / Capture Area */}
      <TouchableOpacity
        style={[styles.imagePicker, imageUri && styles.imagePickerWithImage]}
        onPress={() => pickImage(false)}
        activeOpacity={0.7}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <>
            <View style={styles.imageIconContainer}>
              <MaterialCommunityIcons name="camera" size={40} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.imagePickerTitle}>{t('plantDisease.scanLeaf')}</Text>
            <Text style={styles.imagePickerSubtitle}>{t('plantDisease.scanDesc')}</Text>
          </>
        )}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.white} />
            <Text style={styles.loadingText}>{t('plantDisease.analyzing')}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Capture Buttons */}
      <View style={styles.captureButtonsRow}>
        <TouchableOpacity style={styles.captureBtn} onPress={() => pickImage(true)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="camera" size={20} color={COLORS.white} />
          <Text style={styles.captureBtnText}>{t('plantDisease.takePhoto')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(false)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="image" size={20} color={COLORS.primary} />
          <Text style={styles.uploadBtnText}>{t('plantDisease.gallery')}</Text>
        </TouchableOpacity>
      </View>

      {/* Result Card */}
      {result && (
        <View style={[styles.resultCard, { borderLeftColor: statusColor }]}>
          <View style={styles.resultHeader}>
            <View style={[styles.resultStatusBadge, { backgroundColor: statusColor + '15' }]}>
              <MaterialCommunityIcons
                name={result.is_healthy ? 'check-circle' : 'alert-circle'}
                size={20}
                color={statusColor}
              />
              <Text style={[styles.resultStatusText, { color: statusColor }]}>
                {result.is_healthy ? t('analytics.healthy') : t('plantDisease.diseaseDetected')}
              </Text>
            </View>
            <Text style={styles.resultConfidence}>{result.confidence}%</Text>
          </View>

          <Text style={styles.resultCrop}>{result.crop}</Text>
          <Text style={[styles.resultDisease, { color: statusColor }]}>{result.disease}</Text>

          {/* Top 3 predictions */}
          {result.top3 && (
            <View style={styles.top3Container}>
              <Text style={styles.sectionTitle}>{t('plantDisease.topPredictions')}</Text>
              {result.top3.map((item, idx) => (
                <View key={idx} style={styles.top3Row}>
                  <Text style={styles.top3Label} numberOfLines={1}>{item.class.split('___').pop().replace(/_/g, ' ')}</Text>
                  <View style={styles.top3BarBg}>
                    <View style={[styles.top3BarFill, { width: `${item.confidence}%`, backgroundColor: idx === 0 ? statusColor : COLORS.textTertiary }]} />
                  </View>
                  <Text style={styles.top3Value}>{item.confidence}%</Text>
                </View>
              ))}
            </View>
          )}

          {/* Treatment */}
          <View style={styles.treatmentBox}>
            <MaterialCommunityIcons name="medical-bag" size={18} color={COLORS.primary} />
            <Text style={styles.treatmentText}>{t('plantDisease.treatment')}: {result.treatment}</Text>
          </View>

          {/* Scan Again */}
          <TouchableOpacity
            style={styles.scanAgainBtn}
            onPress={() => { setImageUri(null); setResult(null); }}
          >
            <MaterialCommunityIcons name="refresh" size={18} color={COLORS.primary} />
            <Text style={styles.scanAgainText}>{t('plantDisease.scanAnother')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* How It Works (only show when no result) */}
      {!result && (
        <>
          <Text style={styles.sectionTitle}>{t('plantDisease.howItWorks')}</Text>
          {getHowItWorksSteps(t).map((step) => (
            <StepCard key={step.step} step={step} />
          ))}
        </>
      )}

      {/* Recent Scans */}
      {scanHistory.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>{t('plantDisease.recentScans')}</Text>
          {scanHistory.map((scan) => {
            const isDiseased = scan.status === 'diseased';
            const sc = isDiseased ? COLORS.danger : COLORS.success;
            return (
              <View key={scan.id} style={styles.scanCard}>
                <View style={[styles.scanIconContainer, { backgroundColor: sc + '15' }]}>
                  <MaterialCommunityIcons name="leaf" size={24} color={sc} />
                </View>
                <View style={styles.scanContent}>
                  <View style={styles.scanHeaderRow}>
                    <Text style={styles.scanCropName}>{scan.cropName}</Text>
                    <Text style={styles.scanDate}>{scan.date}</Text>
                  </View>
                  <Text style={[styles.scanResult, { color: sc }]}>{scan.diseaseName}</Text>
                  <View style={styles.scanConfidenceRow}>
                    <Text style={styles.scanConfidenceLabel}>{t('analytics.confidence')}</Text>
                    <View style={styles.scanConfidenceBarContainer}>
                      <View style={[styles.scanConfidenceBarFill, { width: `${scan.confidence}%`, backgroundColor: sc }]} />
                    </View>
                    <Text style={[styles.scanConfidenceValue, { color: sc }]}>{scan.confidence}%</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* Powered by AI Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoCardHeader}>
          <MaterialCommunityIcons name="brain" size={22} color={COLORS.primary} />
          <Text style={styles.infoCardTitle}>{t('plantDisease.poweredByAi')}</Text>
        </View>
        <Text style={styles.infoCardDescription}>
          {t('plantDisease.aiModelDesc')}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  contentContainer: { padding: SPACING.lg, paddingBottom: SPACING.xxxxl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  titlePrefix: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  titleText: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md },

  imagePicker: {
    height: 180, borderRadius: BORDER_RADIUS.lg, borderWidth: 2, borderStyle: 'dashed',
    borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg, backgroundColor: COLORS.background, overflow: 'hidden',
  },
  imagePickerWithImage: { borderStyle: 'solid', borderColor: COLORS.primaryLight, borderWidth: 2 },
  previewImage: { width: '100%', height: '100%', borderRadius: BORDER_RADIUS.lg - 2 },
  imageIconContainer: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  imagePickerTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  imagePickerSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', borderRadius: BORDER_RADIUS.lg,
  },
  loadingText: { color: COLORS.white, fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, marginTop: SPACING.sm },

  captureButtonsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xxl },
  captureBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md,
  },
  captureBtnText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
  uploadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primarySurface, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md,
  },
  uploadBtnText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.primary },

  // Result card
  resultCard: {
    backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl,
    marginBottom: SPACING.xl, borderLeftWidth: 4, ...SHADOWS.sm,
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  resultStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.full },
  resultStatusText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold },
  resultConfidence: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  resultCrop: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  resultDisease: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, marginBottom: SPACING.md },

  top3Container: { marginBottom: SPACING.lg },
  top3Row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  top3Label: { width: 100, fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  top3BarBg: { flex: 1, height: 6, backgroundColor: COLORS.divider, borderRadius: 3, overflow: 'hidden' },
  top3BarFill: { height: 6, borderRadius: 3 },
  top3Value: { width: 40, fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textSecondary, textAlign: 'right' },

  treatmentBox: {
    flexDirection: 'row', gap: SPACING.sm, backgroundColor: COLORS.primarySurface,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md,
  },
  treatmentText: { flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },

  scanAgainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  scanAgainText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.primary },

  // Steps
  stepCard: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, gap: SPACING.md },
  stepNumberContainer: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumber: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  stepContent: { flex: 1 },
  stepIconRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  stepTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  stepDescription: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 18 },

  // Scan history
  scanCard: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, gap: SPACING.md },
  scanIconContainer: { width: 48, height: 48, borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  scanContent: { flex: 1 },
  scanHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  scanCropName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  scanDate: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  scanResult: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, marginBottom: SPACING.sm },
  scanConfidenceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  scanConfidenceLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  scanConfidenceBarContainer: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  scanConfidenceBarFill: { height: '100%', borderRadius: 2 },
  scanConfidenceValue: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold },

  // Info card
  infoCard: { backgroundColor: COLORS.primarySurface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, marginTop: SPACING.lg },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  infoCardTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.primary },
  infoCardDescription: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
});

export default PlantDiseaseScreen;
