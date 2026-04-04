import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';

const SchemeDetailScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { scheme } = route.params;

  const handleVisitWebsite = () => {
    if (scheme.website) {
      Linking.openURL(scheme.website).catch(() => {
        Alert.alert(t('common.error', 'Error'), 'Unable to open website.');
      });
    }
  };

  const handleApplyNow = () => {
    if (scheme.website) {
      Linking.openURL(scheme.website).catch(() => {
        Alert.alert(t('common.error', 'Error'), 'Unable to open website.');
      });
    } else {
      Alert.alert(
        t('schemes.howToApply', 'How to Apply'),
        'Contact your local agriculture office for more details.'
      );
    }
  };

  const categoryLabel = scheme.category.charAt(0).toUpperCase() + scheme.category.slice(1);

  return (
    <ScreenLayout
      title={scheme.name}
      showBack
      onBack={() => navigation.goBack()}
      scrollable
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={[styles.headerIconCircle, { backgroundColor: scheme.color + '20' }]}>
          <MaterialCommunityIcons name={scheme.icon} size={32} color={scheme.color} />
        </View>
        <Text style={styles.headerFullName}>{scheme.fullName}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: scheme.color + '20' }]}>
          <Text style={[styles.categoryBadgeText, { color: scheme.color }]}>{categoryLabel}</Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('marketplace.description', 'Description')}</Text>
        <Text style={styles.sectionText}>{scheme.description}</Text>
      </View>

      {/* Eligibility */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('schemes.eligibility', 'Eligibility')}</Text>
        {scheme.eligibility.map((item, index) => (
          <View key={index} style={styles.eligibilityRow}>
            <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.primaryLight} />
            <Text style={styles.eligibilityText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Benefits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('schemes.benefits', 'Benefits')}</Text>
        <View style={styles.benefitsCard}>
          <MaterialCommunityIcons name="gift-outline" size={22} color={COLORS.primaryLight} />
          <Text style={styles.benefitsText}>{scheme.benefits}</Text>
        </View>
      </View>

      {/* How to Apply */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('schemes.howToApply', 'How to Apply')}</Text>
        <Text style={styles.sectionText}>{scheme.howToApply}</Text>
      </View>

      {/* Deadline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('schemes.deadline', 'Deadline')}</Text>
        <View style={styles.deadlineBadge}>
          <MaterialCommunityIcons name="calendar-clock" size={18} color={COLORS.info} />
          <Text style={styles.deadlineText}>{scheme.deadline}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {scheme.website ? (
          <TouchableOpacity style={styles.websiteButton} onPress={handleVisitWebsite}>
            <MaterialCommunityIcons name="open-in-new" size={18} color={COLORS.primary} />
            <Text style={styles.websiteButtonText}>{t('schemes.visitWebsite', 'Visit Website')}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.applyButton} onPress={handleApplyNow}>
          <MaterialCommunityIcons name="arrow-right-circle" size={20} color={COLORS.white} />
          <Text style={styles.applyButtonText}>{t('schemes.applyNow', 'Apply Now')}</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  headerFullName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  categoryBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sectionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  eligibilityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  eligibilityText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  benefitsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  benefitsText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primary,
    lineHeight: 20,
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '15',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    alignSelf: 'flex-start',
  },
  deadlineText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.info,
  },
  buttonContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySurface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  websiteButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  applyButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default SchemeDetailScreen;
