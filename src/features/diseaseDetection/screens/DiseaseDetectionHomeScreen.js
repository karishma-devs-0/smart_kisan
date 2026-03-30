import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { fetchScanHistory, scanImage } from '../slice/diseaseDetectionSlice';

const severityColors = {
  none: COLORS.success,
  mild: '#FF9800',
  moderate: '#F57C00',
  severe: COLORS.danger,
};

const DiseaseDetectionHomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { scanHistory, loading } = useSelector((s) => s.diseaseDetection);

  useEffect(() => {
    dispatch(fetchScanHistory());
  }, [dispatch]);

  const pickImage = useCallback(async (useCamera) => {
    const permissionMethod = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await permissionMethod();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Needed',
        `Please grant ${useCamera ? 'camera' : 'gallery'} access to scan plants.`,
      );
      return;
    }

    const launchMethod = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await launchMethod({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]) {
      dispatch(scanImage(result.assets[0].uri)).then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          navigation.navigate('ScanResult', { scan: action.payload });
        } else if (action.meta.requestStatus === 'rejected') {
          Alert.alert('Scan Failed', 'Could not analyze the image. Please try again.');
        }
      }).catch(() => {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      });
    }
  }, [dispatch, navigation]);

  const handleScanPress = useCallback(() => {
    Alert.alert(
      'Scan Plant',
      'Choose how to capture the plant image',
      [
        { text: 'Camera', onPress: () => pickImage(true) },
        { text: 'Gallery', onPress: () => pickImage(false) },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [pickImage]);

  const handleScanTap = useCallback((scan) => {
    navigation.navigate('ScanResult', { scan });
  }, [navigation]);

  return (
    <ScreenLayout
      title="Disease Detection"
      showBack
      onBack={() => navigation.goBack()}
    >
      {/* Scan Plant Card */}
      <TouchableOpacity
        style={styles.scanCard}
        onPress={handleScanPress}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.scanCardInner}>
            <ActivityIndicator size="large" color={COLORS.white} />
            <Text style={styles.scanCardTitle}>Analyzing...</Text>
            <Text style={styles.scanCardSubtitle}>AI is detecting diseases</Text>
          </View>
        ) : (
          <View style={styles.scanCardInner}>
            <View style={styles.scanIconCircle}>
              <MaterialCommunityIcons name="camera" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.scanCardTitle}>Scan Plant</Text>
            <Text style={styles.scanCardSubtitle}>
              Take a photo or pick from gallery to detect diseases
            </Text>
            <View style={styles.scanButtonsRow}>
              <View style={styles.scanOptionPill}>
                <MaterialCommunityIcons name="camera" size={16} color={COLORS.white} />
                <Text style={styles.scanOptionText}>Camera</Text>
              </View>
              <View style={styles.scanOptionPill}>
                <MaterialCommunityIcons name="image" size={16} color={COLORS.white} />
                <Text style={styles.scanOptionText}>Gallery</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Recent Scans */}
      <Text style={styles.sectionTitle}>Recent Scans</Text>

      {scanHistory.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="leaf-circle-outline" size={48} color={COLORS.textTertiary} />
          <Text style={styles.emptyText}>No scans yet</Text>
          <Text style={styles.emptySubtext}>Scan a plant to get started</Text>
        </View>
      )}

      {scanHistory.map((scan) => {
        const isHealthy = scan.disease === 'Healthy';
        const statusColor = isHealthy ? COLORS.success : COLORS.danger;
        const sevColor = severityColors[scan.severity] || COLORS.textTertiary;

        return (
          <TouchableOpacity
            key={scan.id}
            style={styles.historyCard}
            onPress={() => handleScanTap(scan)}
            activeOpacity={0.7}
          >
            <View style={[styles.historyIconContainer, { backgroundColor: statusColor + '15' }]}>
              {scan.imagePath ? (
                <Image source={{ uri: scan.imagePath }} style={styles.historyThumb} />
              ) : (
                <MaterialCommunityIcons
                  name={isHealthy ? 'leaf' : 'alert-circle'}
                  size={24}
                  color={statusColor}
                />
              )}
            </View>
            <View style={styles.historyContent}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.historyCropName}>{scan.cropName}</Text>
                <Text style={styles.historyDate}>{scan.date}</Text>
              </View>
              <Text style={[styles.historyDisease, { color: statusColor }]}>
                {scan.disease}
              </Text>
              <View style={styles.historyFooterRow}>
                <View style={styles.confidencePill}>
                  <Text style={styles.confidenceText}>{scan.confidence}%</Text>
                </View>
                {!isHealthy && (
                  <View style={[styles.severityPill, { backgroundColor: sevColor + '15' }]}>
                    <Text style={[styles.severityText, { color: sevColor }]}>
                      {scan.severity}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        );
      })}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // Scan Card
  scanCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    marginBottom: SPACING.xxl,
    ...SHADOWS.md,
  },
  scanCardInner: {
    alignItems: 'center',
  },
  scanIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  scanCardTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  scanCardSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  scanButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  scanOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  scanOptionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
  },

  // Section
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },

  // History Cards
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  historyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  historyThumb: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
  },
  historyContent: {
    flex: 1,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  historyCropName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  historyDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  historyDisease: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: SPACING.sm,
  },
  historyFooterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  confidencePill: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  confidenceText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  severityPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  severityText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    textTransform: 'capitalize',
  },
});

export default DiseaseDetectionHomeScreen;
