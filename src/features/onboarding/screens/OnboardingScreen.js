import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { POPULAR_LOCATIONS, AVAILABLE_LANGUAGES } from '../../settings/mock/settingsMockData';
import { completeOnboarding } from '../slice/onboardingSlice';
import { setLocation, setLanguage } from '../../settings/slice/settingsSlice';
import i18n from '../../../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 4;

const FARM_TYPES = [
  { id: 'crop', icon: 'sprout', label: 'onboarding.farmTypeCrop' },
  { id: 'dairy', icon: 'cow', label: 'onboarding.farmTypeDairy' },
  { id: 'mixed', icon: 'barn', label: 'onboarding.farmTypeMixed' },
  { id: 'orchard', icon: 'tree', label: 'onboarding.farmTypeOrchard' },
  { id: 'poultry', icon: 'bird', label: 'onboarding.farmTypePoultry' },
  { id: 'vegetable', icon: 'carrot', label: 'onboarding.farmTypeVegetable' },
];

const FARM_SIZES = [
  { id: 'small', label: 'onboarding.farmSizeSmall', desc: '< 2 acres' },
  { id: 'medium', label: 'onboarding.farmSizeMedium', desc: '2–10 acres' },
  { id: 'large', label: 'onboarding.farmSizeLarge', desc: '10–50 acres' },
  { id: 'xlarge', label: 'onboarding.farmSizeXLarge', desc: '50+ acres' },
];

const OnboardingScreen = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.onboarding);

  const [step, setStep] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const [farmName, setFarmName] = useState('');
  const [farmType, setFarmType] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');

  const animateProgress = (toStep) => {
    Animated.timing(progressAnim, {
      toValue: toStep / (TOTAL_STEPS - 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      const next = step + 1;
      setStep(next);
      animateProgress(next);
    }
  };

  const goBack = () => {
    if (step > 0) {
      const prev = step - 1;
      setStep(prev);
      animateProgress(prev);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return true; // Welcome step
      case 1:
        return farmName.trim().length > 0 && farmType && farmSize;
      case 2:
        return selectedLocation !== null;
      case 3:
        return true; // Language always has a default
      default:
        return false;
    }
  };

  const handleFinish = () => {
    // Apply language
    i18n.changeLanguage(selectedLanguage);
    dispatch(setLanguage(selectedLanguage));

    // Apply location
    if (selectedLocation) {
      dispatch(setLocation(selectedLocation));
    }

    // Save profile to Firestore
    dispatch(
      completeOnboarding({
        farmName: farmName.trim(),
        farmType,
        farmSize,
        location: selectedLocation,
        language: selectedLanguage,
      }),
    );
  };

  const filteredLocations = locationSearch.trim()
    ? POPULAR_LOCATIONS.filter((loc) =>
        loc.name.toLowerCase().includes(locationSearch.toLowerCase()),
      )
    : POPULAR_LOCATIONS;

  // ─── Step renderers ──────────────────────────────────────────────────────────

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeIconWrap}>
        <MaterialCommunityIcons name="sprout" size={64} color={COLORS.white} />
      </View>
      <Text style={styles.welcomeTitle}>
        {t('onboarding.welcomeTitle', { name: user?.name || t('onboarding.farmer') })}
      </Text>
      <Text style={styles.welcomeSubtitle}>{t('onboarding.welcomeSubtitle')}</Text>

      <View style={styles.featureList}>
        {[
          { icon: 'weather-partly-cloudy', text: t('onboarding.featureWeather') },
          { icon: 'water-pump', text: t('onboarding.featurePump') },
          { icon: 'leaf', text: t('onboarding.featureSoil') },
          { icon: 'chart-line', text: t('onboarding.featureAnalytics') },
        ].map((item) => (
          <View key={item.icon} style={styles.featureRow}>
            <View style={styles.featureIconWrap}>
              <MaterialCommunityIcons name={item.icon} size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderFarmProfile = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>{t('onboarding.farmProfileTitle')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding.farmProfileSubtitle')}</Text>

      {/* Farm Name */}
      <Text style={styles.fieldLabel}>{t('onboarding.farmNameLabel')}</Text>
      <TextInput
        style={styles.textInput}
        placeholder={t('onboarding.farmNamePlaceholder')}
        placeholderTextColor={COLORS.textTertiary}
        value={farmName}
        onChangeText={setFarmName}
        autoCapitalize="words"
      />

      {/* Farm Type */}
      <Text style={styles.fieldLabel}>{t('onboarding.farmTypeLabel')}</Text>
      <View style={styles.chipGrid}>
        {FARM_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[styles.chip, farmType === type.id && styles.chipActive]}
            onPress={() => setFarmType(type.id)}
          >
            <MaterialCommunityIcons
              name={type.icon}
              size={20}
              color={farmType === type.id ? COLORS.white : COLORS.primary}
            />
            <Text style={[styles.chipText, farmType === type.id && styles.chipTextActive]}>
              {t(type.label)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Farm Size */}
      <Text style={styles.fieldLabel}>{t('onboarding.farmSizeLabel')}</Text>
      <View style={styles.sizeGrid}>
        {FARM_SIZES.map((size) => (
          <TouchableOpacity
            key={size.id}
            style={[styles.sizeCard, farmSize === size.id && styles.sizeCardActive]}
            onPress={() => setFarmSize(size.id)}
          >
            <Text style={[styles.sizeLabel, farmSize === size.id && styles.sizeLabelActive]}>
              {t(size.label)}
            </Text>
            <Text style={[styles.sizeDesc, farmSize === size.id && styles.sizeDescActive]}>
              {size.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderLocation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('onboarding.locationTitle')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding.locationSubtitle')}</Text>

      {/* Search */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('onboarding.locationSearchPlaceholder')}
          placeholderTextColor={COLORS.textTertiary}
          value={locationSearch}
          onChangeText={setLocationSearch}
        />
        {locationSearch.length > 0 && (
          <TouchableOpacity onPress={() => setLocationSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Location List */}
      <FlatList
        data={filteredLocations}
        keyExtractor={(item) => item.name}
        showsVerticalScrollIndicator={false}
        style={styles.locationList}
        renderItem={({ item }) => {
          const isSelected = selectedLocation?.name === item.name;
          return (
            <TouchableOpacity
              style={[styles.locationItem, isSelected && styles.locationItemActive]}
              onPress={() => setSelectedLocation(item)}
            >
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={isSelected ? COLORS.primary : COLORS.textTertiary}
              />
              <Text style={[styles.locationName, isSelected && styles.locationNameActive]}>
                {item.name}
              </Text>
              {isSelected && (
                <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  const renderLanguage = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('onboarding.languageTitle')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding.languageSubtitle')}</Text>

      <View style={styles.languageGrid}>
        {AVAILABLE_LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.languageCard, isSelected && styles.languageCardActive]}
              onPress={() => setSelectedLanguage(lang.code)}
            >
              <Text style={[styles.languageFlag, isSelected && styles.languageFlagActive]}>
                {lang.flag}
              </Text>
              <Text
                style={[styles.languageNative, isSelected && styles.languageNativeActive]}
              >
                {lang.nativeLabel}
              </Text>
              <Text style={[styles.languageEn, isSelected && styles.languageEnActive]}>
                {lang.name}
              </Text>
              {isSelected && (
                <View style={styles.languageCheck}>
                  <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const steps = [renderWelcome, renderFarmProfile, renderLocation, renderLanguage];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }]}>
        {/* Progress Bar */}
        <View style={styles.progressRow}>
          {step > 0 && (
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.stepIndicator}>
            {step + 1}/{TOTAL_STEPS}
          </Text>
        </View>

        {/* Step Content */}
        <View style={styles.content}>{steps[step]()}</View>

        {/* Bottom Button */}
        <TouchableOpacity
          style={[styles.primaryButton, !canProceed() && styles.primaryButtonDisabled]}
          onPress={step === TOTAL_STEPS - 1 ? handleFinish : goNext}
          disabled={!canProceed() || loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>
                {step === 0
                  ? t('onboarding.getStarted')
                  : step === TOTAL_STEPS - 1
                    ? t('onboarding.finish')
                    : t('common.next')}
              </Text>
              {step < TOTAL_STEPS - 1 && (
                <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1, paddingHorizontal: SPACING.xxl },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  backButton: { padding: 4 },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  stepIndicator: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    fontWeight: FONT_WEIGHTS.medium,
    minWidth: 30,
    textAlign: 'right',
  },

  // Content
  content: { flex: 1 },
  stepContainer: { flex: 1 },

  // Welcome
  welcomeIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.xxl,
  },
  welcomeTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  welcomeSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxxl,
  },
  featureList: { gap: SPACING.lg },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
    flex: 1,
  },

  // Step header
  stepTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  stepSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
    lineHeight: 22,
  },

  // Text input
  fieldLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xl,
  },

  // Chips (farm type)
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  chipTextActive: {
    color: COLORS.white,
  },

  // Size cards
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  sizeCard: {
    width: '48%',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  sizeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  sizeLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  sizeLabelActive: { color: COLORS.primary },
  sizeDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  sizeDescActive: { color: COLORS.primary },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },

  // Location list
  locationList: { flex: 1 },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: 2,
  },
  locationItemActive: {
    backgroundColor: COLORS.primarySurface,
  },
  locationName: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  locationNameActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },

  // Language grid
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  languageCard: {
    width: '31%',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    position: 'relative',
  },
  languageCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  languageFlag: {
    fontSize: 28,
    marginBottom: 4,
    color: COLORS.textTertiary,
  },
  languageFlagActive: { color: COLORS.primary },
  languageNative: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  languageNativeActive: { color: COLORS.primary },
  languageEn: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  languageEnActive: { color: COLORS.primary },
  languageCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Primary button
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 16,
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default OnboardingScreen;
