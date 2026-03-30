import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { logout } from '../../auth/slice/authSlice';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { useTranslation } from 'react-i18next';

const getFeatureItems = (t) => [
  { icon: 'store', label: t('marketplace.title', 'Marketplace'), screen: 'Marketplace', color: '#FF9800' },
  { icon: 'sprout', label: t('cropRecommend.title', 'Crop Suitability'), screen: 'CropRecommend', color: '#4CAF50' },
  { icon: 'leaf', label: t('diseaseDetection.title', 'Disease Detection'), screen: 'DiseaseDetection', color: '#F44336' },
  { icon: 'calculator', label: t('fertilizerCalc.title', 'Fertilizer Calculator'), screen: 'FertilizerCalculator', color: '#9C27B0' },
];

const getMenuItems = (t) => [
  { icon: 'barn', label: t('settings.farmSetup'), setting: 'farmSetup' },
  { icon: 'map-marker-outline', label: t('settings.location'), setting: 'location' },
  { icon: 'access-point', label: t('settings.iotDevices'), setting: 'iotDevices' },
  { icon: 'translate', label: t('settings.language'), setting: 'language' },
  { icon: 'bell-outline', label: t('settings.notifications'), setting: 'notifications' },
  { icon: 'cloud-off-outline', label: t('settings.offlineAccess'), setting: 'offline' },
  { icon: 'sync', label: t('settings.dataSync'), setting: 'dataSync' },
  { icon: 'help-circle-outline', label: t('settings.helpCenter'), setting: 'help' },
  { icon: 'headphones', label: t('settings.contactSupport'), setting: 'support' },
];

const SettingsMainScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const menuItems = getMenuItems(t);
  const featureItems = getFeatureItems(t);

  return (
    <ScreenLayout title="Settings" scrollable={true}>
      {/* Profile */}
      <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('UserProfile')}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(user?.name || 'RK').substring(0, 2).toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user?.name || 'Rajesh Kumar'}</Text>
          <Text style={styles.profileRole}>{t('settings.farmManager')}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>
      {/* Feature Tools */}
      <Text style={styles.sectionLabel}>{t('settings.tools', 'Tools & Features')}</Text>
      <View style={styles.featureGrid}>
        {featureItems.map((item, i) => (
          <TouchableOpacity key={i} style={styles.featureCard} onPress={() => navigation.navigate(item.screen)}>
            <View style={[styles.featureIcon, { backgroundColor: item.color + '20' }]}>
              <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={styles.featureLabel} numberOfLines={2}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Settings */}
      <Text style={styles.sectionLabel}>{t('settings.title', 'Settings')}</Text>
      {/* Menu */}
      <View style={styles.menuCard}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={[styles.menuRow, i < menuItems.length - 1 && styles.menuBorder]} onPress={() => {
            if (item.setting === 'notifications') {
              navigation.navigate('NotificationSettings');
            } else {
              navigation.navigate('SettingsDetail', { setting: item.setting, title: item.label });
            }
          }}>
            <MaterialCommunityIcons name={item.icon} size={22} color={COLORS.textSecondary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>
      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())}>
        <MaterialCommunityIcons name="logout" size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>{t('common.logout')}</Text>
      </TouchableOpacity>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, gap: SPACING.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  profileName: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  profileRole: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  menuCard: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.xxl },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  menuLabel: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  sectionLabel: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textSecondary, marginBottom: SPACING.md, textTransform: 'uppercase', letterSpacing: 1 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xl },
  featureCard: { width: '47%', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm },
  featureIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.textPrimary, textAlign: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.danger + '40' },
  logoutText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.danger },
});

export default SettingsMainScreen;
