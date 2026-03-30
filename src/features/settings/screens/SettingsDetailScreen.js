import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import { setLanguage, toggleNotifications, toggleOfflineMode, toggleDataSync, setLocation, toggleSmsAlerts, toggleEmailNotifications, toggleSoundAlerts } from '../slice/settingsSlice';
import { useTranslation } from 'react-i18next';
import { AVAILABLE_LANGUAGES, POPULAR_LOCATIONS } from '../mock/settingsMockData';

const SettingsDetailScreen = ({ navigation, route }) => {
  const { setting, title } = route.params || {};
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const settings = useSelector((s) => s.settings);
  const [locationSearch, setLocationSearch] = useState('');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');

  const handleLanguageChange = (code) => {
    dispatch(setLanguage(code));
    i18n.changeLanguage(code);
  };

  const handleLocationSelect = (loc) => {
    dispatch(setLocation({ name: loc.name, lat: loc.lat, lng: loc.lng }));
  };

  const handleCustomLocation = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      dispatch(setLocation({ name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng }));
      setCustomLat('');
      setCustomLng('');
    }
  };

  const filteredLocations = locationSearch.trim()
    ? POPULAR_LOCATIONS.filter((loc) => loc.name.toLowerCase().includes(locationSearch.toLowerCase()))
    : POPULAR_LOCATIONS;

  const ToggleRow = ({ label, value, onToggle }) => (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <TouchableOpacity style={[styles.toggle, value && styles.toggleOn]} onPress={onToggle}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (setting) {
      case 'language':
        return (
          <View style={styles.card}>
            {AVAILABLE_LANGUAGES.map((lang) => {
              const isActive = lang.code === settings.language;
              return (
                <TouchableOpacity key={lang.code} style={[styles.radioRow, isActive && styles.radioRowActive]} onPress={() => handleLanguageChange(lang.code)}>
                  <View style={styles.langInfo}>
                    <View style={[styles.langFlag, isActive && styles.langFlagActive]}>
                      <Text style={[styles.langFlagText, isActive && styles.langFlagTextActive]}>{lang.flag}</Text>
                    </View>
                    <View>
                      <Text style={[styles.radioLabel, isActive && { color: COLORS.primary }]}>{lang.nativeLabel}</Text>
                      <Text style={styles.langSubLabel}>{lang.name}</Text>
                    </View>
                  </View>
                  <View style={[styles.radio, isActive && styles.radioActive]}>
                    {isActive && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case 'location':
        return (
          <>
            {/* Current Location */}
            <View style={styles.card}>
              <View style={styles.currentLocationRow}>
                <MaterialCommunityIcons name="map-marker" size={24} color={COLORS.primary} />
                <View style={styles.currentLocationInfo}>
                  <Text style={styles.currentLocationLabel}>{t('settings.detail.currentLocation')}</Text>
                  <Text style={styles.currentLocationName}>{settings.location?.name || 'Not set'}</Text>
                  {settings.location?.lat && (
                    <Text style={styles.currentLocationCoords}>
                      {settings.location.lat.toFixed(4)}°N, {settings.location.lng.toFixed(4)}°E
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Search */}
            <View style={[styles.card, { marginTop: SPACING.lg }]}>
              <View style={styles.searchRow}>
                <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('settings.detail.searchLocation')}
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
            </View>

            {/* Popular Locations */}
            <Text style={styles.sectionLabel}>{t('settings.detail.popularLocations')}</Text>
            <View style={styles.card}>
              {filteredLocations.map((loc, i) => {
                const isSelected = settings.location?.name === loc.name;
                return (
                  <TouchableOpacity
                    key={loc.name}
                    style={[styles.locationRow, isSelected && styles.locationRowActive, i < filteredLocations.length - 1 && styles.locationBorder]}
                    onPress={() => handleLocationSelect(loc)}
                  >
                    <MaterialCommunityIcons name={isSelected ? 'map-marker-check' : 'map-marker-outline'} size={20} color={isSelected ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.locationName, isSelected && { color: COLORS.primary, fontWeight: FONT_WEIGHTS.semiBold }]}>{loc.name}</Text>
                    {isSelected && <MaterialCommunityIcons name="check" size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
              {filteredLocations.length === 0 && (
                <Text style={styles.noResults}>{t('settings.detail.noLocationsFound')}</Text>
              )}
            </View>

            {/* Custom Coordinates */}
            <Text style={styles.sectionLabel}>{t('settings.detail.customCoordinates')}</Text>
            <View style={styles.card}>
              <View style={styles.coordsRow}>
                <View style={styles.coordInput}>
                  <Text style={styles.coordLabel}>{t('settings.detail.latitude')}</Text>
                  <TextInput
                    style={styles.coordTextInput}
                    placeholder="e.g. 21.1458"
                    placeholderTextColor={COLORS.textTertiary}
                    value={customLat}
                    onChangeText={setCustomLat}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.coordInput}>
                  <Text style={styles.coordLabel}>{t('settings.detail.longitude')}</Text>
                  <TextInput
                    style={styles.coordTextInput}
                    placeholder="e.g. 79.0882"
                    placeholderTextColor={COLORS.textTertiary}
                    value={customLng}
                    onChangeText={setCustomLng}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.setLocationBtn} onPress={handleCustomLocation}>
                <MaterialCommunityIcons name="crosshairs-gps" size={18} color={COLORS.white} />
                <Text style={styles.setLocationBtnText}>{t('settings.detail.setLocation')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.locationHint}>{t('settings.detail.locationHint')}</Text>
          </>
        );
      case 'notifications':
        return (
          <View style={styles.card}>
            <ToggleRow label={t('settings.detail.pushNotifications')} value={settings.notifications} onToggle={() => dispatch(toggleNotifications())} />
            <ToggleRow label={t('settings.detail.smsAlerts')} value={settings.smsAlerts} onToggle={() => dispatch(toggleSmsAlerts())} />
            <ToggleRow label={t('settings.detail.emailNotifications')} value={settings.emailNotifications} onToggle={() => dispatch(toggleEmailNotifications())} />
            <ToggleRow label={t('settings.detail.soundAlerts')} value={settings.soundAlerts} onToggle={() => dispatch(toggleSoundAlerts())} />
          </View>
        );
      case 'offline':
        return (
          <View style={styles.card}>
            <ToggleRow label={t('settings.detail.offlineMode')} value={settings.offlineMode} onToggle={() => dispatch(toggleOfflineMode())} />
            <Text style={styles.desc}>{t('settings.detail.offlineModeDesc')}</Text>
          </View>
        );
      case 'dataSync':
        return (
          <View style={styles.card}>
            <ToggleRow label={t('settings.detail.autoDataSync')} value={settings.dataSyncEnabled} onToggle={() => dispatch(toggleDataSync())} />
            <Text style={styles.desc}>{t('settings.detail.autoDataSyncDesc')}</Text>
          </View>
        );
      default:
        return (
          <View style={styles.comingSoonCard}>
            <View style={styles.comingSoonIconCircle}>
              <MaterialCommunityIcons name="hammer-wrench" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.comingSoonTitle}>{t('settings.detail.comingSoon', { title: title || t('settings.farmSetup') })}</Text>
            <Text style={styles.comingSoonDesc}>
              This feature is currently under development. We are working hard to bring it to you in an upcoming update.
            </Text>
            <View style={styles.comingSoonDivider} />
            <View style={styles.comingSoonHintRow}>
              <MaterialCommunityIcons name="bell-ring-outline" size={18} color={COLORS.textTertiary} />
              <Text style={styles.comingSoonHint}>
                Enable notifications to get alerted when new features are available.
              </Text>
            </View>
          </View>
        );
    }
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>{title || 'Settings'}</Text>
      </View>
      {renderContent()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxxl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  card: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  radioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  radioRowActive: { backgroundColor: COLORS.primarySurface },
  radioLabel: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: FONT_WEIGHTS.medium },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: COLORS.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  langInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  langFlag: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  langFlagActive: { backgroundColor: COLORS.primary + '20' },
  langFlagText: { fontSize: 16, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textSecondary },
  langFlagTextActive: { color: COLORS.primary },
  langSubLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  toggleLabel: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: COLORS.border, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: COLORS.primaryLight },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.white },
  toggleThumbOn: { alignSelf: 'flex-end' },
  desc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, padding: SPACING.lg, lineHeight: 20 },
  placeholder: { fontSize: FONT_SIZES.md, color: COLORS.textTertiary, padding: SPACING.lg, textAlign: 'center' },
  comingSoonCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', paddingVertical: SPACING.xxxxl, paddingHorizontal: SPACING.xl },
  comingSoonIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primarySurface, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  comingSoonTitle: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  comingSoonDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: SPACING.md },
  comingSoonDivider: { width: '100%', height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.xl },
  comingSoonHintRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.sm },
  comingSoonHint: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, flex: 1, lineHeight: 18 },
  // Location styles
  currentLocationRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  currentLocationInfo: { flex: 1 },
  currentLocationLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginBottom: 2 },
  currentLocationName: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  currentLocationCoords: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary, paddingVertical: SPACING.sm },
  sectionLabel: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textSecondary, marginTop: SPACING.xl, marginBottom: SPACING.sm, marginLeft: SPACING.xs },
  locationRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  locationRowActive: { backgroundColor: COLORS.primarySurface },
  locationBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  locationName: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  noResults: { padding: SPACING.lg, fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, textAlign: 'center' },
  coordsRow: { flexDirection: 'row', padding: SPACING.lg, gap: SPACING.md },
  coordInput: { flex: 1 },
  coordLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  coordTextInput: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  setLocationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, margin: SPACING.lg, marginTop: 0, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, gap: SPACING.sm },
  setLocationBtnText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },
  locationHint: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: SPACING.md, lineHeight: 18, paddingHorizontal: SPACING.xs },
});

export default SettingsDetailScreen;
