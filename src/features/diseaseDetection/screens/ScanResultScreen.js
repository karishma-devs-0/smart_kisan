import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { scanImage } from '../slice/diseaseDetectionSlice';

const severityConfig = {
  none: { color: COLORS.success, label: 'Healthy', icon: 'check-circle' },
  mild: { color: '#FF9800', label: 'Mild', icon: 'alert-circle-outline' },
  moderate: { color: '#F57C00', label: 'Moderate', icon: 'alert-circle' },
  severe: { color: COLORS.danger, label: 'Severe', icon: 'alert-octagon' },
};

const ScanResultScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const scan = route.params?.scan;

  const isHealthy = scan?.disease === 'Healthy';
  const sev = severityConfig[scan?.severity] || severityConfig.none;
  const statusColor = isHealthy ? COLORS.success : COLORS.danger;

  const chemicalTreatments = (scan?.treatments || []).filter((tr) => tr.type === 'chemical');
  const organicTreatments = (scan?.treatments || []).filter((tr) => tr.type === 'organic');

  const handleScanAgain = useCallback(async () => {
    Alert.alert(
      'Scan Again',
      'Choose how to capture the plant image',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                'Permission Needed',
                'Camera access is required to scan plants. Please enable it in your device settings.',
              );
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.8,
              allowsEditing: true,
              aspect: [1, 1],
            });
            if (!result.canceled && result.assets?.[0]) {
              dispatch(scanImage(result.assets[0].uri)).then((action) => {
                if (action.meta.requestStatus === 'fulfilled') {
                  navigation.replace('ScanResult', { scan: action.payload });
                } else {
                  Alert.alert('Scan Failed', 'Could not analyze the image. Please try again.');
                }
              }).catch(() => Alert.alert('Error', 'Something went wrong.'));
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                'Permission Needed',
                'Gallery access is required to select plant images. Please enable it in your device settings.',
              );
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
              allowsEditing: true,
              aspect: [1, 1],
            });
            if (!result.canceled && result.assets?.[0]) {
              dispatch(scanImage(result.assets[0].uri)).then((action) => {
                if (action.meta.requestStatus === 'fulfilled') {
                  navigation.replace('ScanResult', { scan: action.payload });
                } else {
                  Alert.alert('Scan Failed', 'Could not analyze the image. Please try again.');
                }
              }).catch(() => Alert.alert('Error', 'Something went wrong.'));
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [dispatch, navigation]);

  if (!scan) {
    return (
      <ScreenLayout title="Scan Result" showBack onBack={() => navigation.goBack()}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.textTertiary} />
          <Text style={styles.emptyText}>No scan data available</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Scan Result" showBack onBack={() => navigation.goBack()}>
      {/* Image Preview */}
      <View style={styles.imageContainer}>
        {scan.imagePath ? (
          <Image source={{ uri: scan.imagePath }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialCommunityIcons name="leaf" size={48} color={COLORS.textTertiary} />
            <Text style={styles.placeholderText}>No image captured</Text>
          </View>
        )}
      </View>

      {/* Disease Name / Healthy + Confidence */}
      <View style={[styles.resultCard, { borderLeftColor: statusColor }]}>
        <View style={styles.resultHeader}>
          <View>
            <Text style={styles.cropName}>{scan.cropName}</Text>
            <Text style={[styles.diseaseName, { color: statusColor }]}>
              {isHealthy ? 'Healthy Plant' : scan.disease}
            </Text>
          </View>
          <View style={styles.confidenceCircle}>
            <Text style={styles.confidenceValue}>{scan.confidence}%</Text>
            <Text style={styles.confidenceLabel}>Confidence</Text>
          </View>
        </View>

        {/* Severity Badge */}
        <View style={[styles.severityBadge, { backgroundColor: sev.color + '15' }]}>
          <MaterialCommunityIcons name={sev.icon} size={18} color={sev.color} />
          <Text style={[styles.severityText, { color: sev.color }]}>{sev.label}</Text>
        </View>
      </View>

      {/* Symptoms */}
      {scan.symptoms && scan.symptoms.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Symptoms</Text>
          </View>
          {scan.symptoms.map((symptom, index) => (
            <View key={index} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{symptom}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Chemical Treatments */}
      {chemicalTreatments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="flask" size={20} color={COLORS.info} />
            <Text style={styles.sectionTitle}>Chemical Treatment</Text>
          </View>
          {chemicalTreatments.map((tr, index) => (
            <View key={index} style={styles.treatmentCard}>
              <Text style={styles.treatmentName}>{tr.name}</Text>
              <View style={styles.treatmentDetail}>
                <MaterialCommunityIcons name="eyedropper" size={14} color={COLORS.textSecondary} />
                <Text style={styles.treatmentDetailText}>Dosage: {tr.dosage}</Text>
              </View>
              <View style={styles.treatmentDetail}>
                <MaterialCommunityIcons name="spray" size={14} color={COLORS.textSecondary} />
                <Text style={styles.treatmentDetailText}>{tr.method}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Organic Alternatives */}
      {organicTreatments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="leaf" size={20} color={COLORS.success} />
            <Text style={styles.sectionTitle}>Organic Alternative</Text>
          </View>
          {organicTreatments.map((tr, index) => (
            <View key={index} style={[styles.treatmentCard, styles.organicCard]}>
              <Text style={styles.treatmentName}>{tr.name}</Text>
              <View style={styles.treatmentDetail}>
                <MaterialCommunityIcons name="eyedropper" size={14} color={COLORS.textSecondary} />
                <Text style={styles.treatmentDetailText}>Dosage: {tr.dosage}</Text>
              </View>
              <View style={styles.treatmentDetail}>
                <MaterialCommunityIcons name="spray" size={14} color={COLORS.textSecondary} />
                <Text style={styles.treatmentDetailText}>{tr.method}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Preventive Measures */}
      {scan.preventiveMeasures && scan.preventiveMeasures.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.warning} />
            <Text style={styles.sectionTitle}>Preventive Measures</Text>
          </View>
          {scan.preventiveMeasures.map((measure, index) => (
            <View key={index} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.bulletText}>{measure}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Scan Again Button */}
      <TouchableOpacity style={styles.scanAgainButton} onPress={handleScanAgain} activeOpacity={0.8}>
        <MaterialCommunityIcons name="camera-retake" size={20} color={COLORS.white} />
        <Text style={styles.scanAgainText}>Scan Again</Text>
      </TouchableOpacity>

      <View style={{ height: SPACING.xxl }} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // Image
  imageContainer: {
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
  },

  // Result Card
  resultCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cropName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  diseaseName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  confidenceCircle: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minWidth: 72,
  },
  confidenceValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  confidenceLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },

  // Severity Badge
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  severityText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
  },

  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },

  // Bullet List
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Treatment Cards
  treatmentCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  organicCard: {
    borderLeftColor: COLORS.success,
  },
  treatmentName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  treatmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  treatmentDetailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },

  // Scan Again
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  scanAgainText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});

export default ScanResultScreen;
