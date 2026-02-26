import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';

const MOCK_RECENT_SCANS = [
  {
    id: '1',
    cropName: 'Tomato',
    diseaseName: 'Early Blight',
    confidence: 94,
    date: '2026-02-23',
    status: 'diseased',
  },
  {
    id: '2',
    cropName: 'Rice',
    diseaseName: 'Healthy',
    confidence: 98,
    date: '2026-02-22',
    status: 'healthy',
  },
  {
    id: '3',
    cropName: 'Wheat',
    diseaseName: 'Leaf Rust',
    confidence: 87,
    date: '2026-02-21',
    status: 'diseased',
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    icon: 'camera',
    title: 'Capture Leaf Image',
    description: 'Take a clear photo of the affected leaf using your camera',
  },
  {
    step: 2,
    icon: 'brain',
    title: 'AI Analyzes the Image',
    description: 'Our deep learning model processes the image in seconds',
  },
  {
    step: 3,
    icon: 'clipboard-check',
    title: 'Get Diagnosis & Treatment',
    description: 'Receive disease identification and recommended treatment plan',
  },
];

const handleComingSoon = () => {
  Alert.alert('Coming Soon', 'ML model integration pending');
};

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

const RecentScanCard = ({ scan }) => {
  const isDiseased = scan.status === 'diseased';
  const statusColor = isDiseased ? COLORS.danger : COLORS.success;
  return (
    <TouchableOpacity style={styles.scanCard} onPress={handleComingSoon} activeOpacity={0.7}>
      <View style={[styles.scanIconContainer, { backgroundColor: statusColor + '15' }]}>
        <MaterialCommunityIcons name="leaf" size={24} color={statusColor} />
      </View>
      <View style={styles.scanContent}>
        <View style={styles.scanHeaderRow}>
          <Text style={styles.scanCropName}>{scan.cropName}</Text>
          <Text style={styles.scanDate}>{scan.date}</Text>
        </View>
        <Text style={[styles.scanResult, { color: statusColor }]}>{scan.diseaseName}</Text>
        <View style={styles.scanConfidenceRow}>
          <Text style={styles.scanConfidenceLabel}>Confidence</Text>
          <View style={styles.scanConfidenceBarContainer}>
            <View style={[styles.scanConfidenceBarFill, { width: `${scan.confidence}%`, backgroundColor: statusColor }]} />
          </View>
          <Text style={[styles.scanConfidenceValue, { color: statusColor }]}>{scan.confidence}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const PlantDiseaseScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

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
        <Text style={styles.titlePrefix}>Plant</Text>
        <Text style={styles.titleText}> Disease</Text>
      </View>

      {/* Camera / Image Capture Area */}
      <TouchableOpacity style={styles.imagePicker} onPress={handleComingSoon} activeOpacity={0.7}>
        <View style={styles.imageIconContainer}>
          <MaterialCommunityIcons name="camera" size={40} color={COLORS.textSecondary} />
        </View>
        <Text style={styles.imagePickerTitle}>Scan a Plant Leaf</Text>
        <Text style={styles.imagePickerSubtitle}>Detect diseases using AI-powered image analysis</Text>
      </TouchableOpacity>
      <View style={styles.captureButtonsRow}>
        <TouchableOpacity style={styles.captureBtn} onPress={handleComingSoon} activeOpacity={0.7}>
          <MaterialCommunityIcons name="camera" size={20} color={COLORS.white} />
          <Text style={styles.captureBtnText}>Take a Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadBtn} onPress={handleComingSoon} activeOpacity={0.7}>
          <MaterialCommunityIcons name="image" size={20} color={COLORS.primary} />
          <Text style={styles.uploadBtnText}>Upload from Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* How It Works */}
      <Text style={styles.sectionTitle}>How It Works</Text>
      {HOW_IT_WORKS_STEPS.map((step) => (
        <StepCard key={step.step} step={step} />
      ))}

      {/* Recent Scans */}
      <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Recent Scans</Text>
      {MOCK_RECENT_SCANS.map((scan) => (
        <RecentScanCard key={scan.id} scan={scan} />
      ))}

      {/* Powered by AI Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoCardHeader}>
          <MaterialCommunityIcons name="brain" size={22} color={COLORS.primary} />
          <Text style={styles.infoCardTitle}>Powered by AI</Text>
        </View>
        <Text style={styles.infoCardDescription}>
          Our plant disease detection model is trained on over 50,000 leaf images across 38 disease categories. The model achieves 95.6% accuracy on validation data and supports major crops including rice, wheat, tomato, potato, corn, and more.
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

  // Image Capture Area
  imagePicker: {
    height: 180,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  imageIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  imagePickerTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  imagePickerSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  captureButtonsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xxl },
  captureBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  captureBtnText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primarySurface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  uploadBtnText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.primary },

  // How It Works Steps
  stepCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  stepContent: { flex: 1 },
  stepIconRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  stepTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  stepDescription: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 18 },

  // Recent Scan Cards
  scanCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  scanIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
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

  // Powered by AI Info Card
  infoCard: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginTop: SPACING.lg,
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  infoCardTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.primary },
  infoCardDescription: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
});

export default PlantDiseaseScreen;
