import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import { setLanguage, toggleNotifications, toggleOfflineMode, toggleDataSync } from '../slice/settingsSlice';
import { AVAILABLE_LANGUAGES } from '../mock/settingsMockData';

const SettingsDetailScreen = ({ navigation, route }) => {
  const { setting, title } = route.params || {};
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const settings = useSelector((s) => s.settings);

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
            {AVAILABLE_LANGUAGES.map((lang) => (
              <TouchableOpacity key={lang.code} style={[styles.radioRow, lang.code === settings.language && styles.radioRowActive]} onPress={() => dispatch(setLanguage(lang.code))}>
                <Text style={styles.radioLabel}>{lang.name}</Text>
                <View style={[styles.radio, lang.code === settings.language && styles.radioActive]}>
                  {lang.code === settings.language && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 'notifications':
        return (
          <View style={styles.card}>
            <ToggleRow label="Push Notifications" value={settings.notifications} onToggle={() => dispatch(toggleNotifications())} />
            <ToggleRow label="SMS Alerts" value={true} onToggle={() => {}} />
            <ToggleRow label="Email Notifications" value={false} onToggle={() => {}} />
            <ToggleRow label="Sound Alerts" value={true} onToggle={() => {}} />
          </View>
        );
      case 'offline':
        return (
          <View style={styles.card}>
            <ToggleRow label="Offline Mode" value={settings.offlineMode} onToggle={() => dispatch(toggleOfflineMode())} />
            <Text style={styles.desc}>When enabled, the app will work without internet using cached data.</Text>
          </View>
        );
      case 'dataSync':
        return (
          <View style={styles.card}>
            <ToggleRow label="Auto Data Sync" value={settings.dataSyncEnabled} onToggle={() => dispatch(toggleDataSync())} />
            <Text style={styles.desc}>Automatically sync data when connected to the internet.</Text>
          </View>
        );
      default:
        return (
          <View style={styles.card}>
            <Text style={styles.placeholder}>{title || 'Settings'} content coming soon.</Text>
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
  radioLabel: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: COLORS.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  toggleLabel: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: COLORS.border, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: COLORS.primaryLight },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.white },
  toggleThumbOn: { alignSelf: 'flex-end' },
  desc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, padding: SPACING.lg, lineHeight: 20 },
  placeholder: { fontSize: FONT_SIZES.md, color: COLORS.textTertiary, padding: SPACING.lg, textAlign: 'center' },
});

export default SettingsDetailScreen;
