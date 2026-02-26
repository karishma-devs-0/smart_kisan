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

const menuItems = [
  { icon: 'barn', label: 'Farm Setup', setting: 'farmSetup' },
  { icon: 'access-point', label: 'IoT Devices', setting: 'iotDevices' },
  { icon: 'translate', label: 'Language', setting: 'language' },
  { icon: 'bell-outline', label: 'Notifications', setting: 'notifications' },
  { icon: 'cloud-off-outline', label: 'Offline Access', setting: 'offline' },
  { icon: 'sync', label: 'Data Sync', setting: 'dataSync' },
  { icon: 'help-circle-outline', label: 'Help Center', setting: 'help' },
  { icon: 'headphones', label: 'Contact Support', setting: 'support' },
];

const SettingsMainScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  return (
    <ScreenLayout title="Settings" scrollable={true}>
      {/* Profile */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(user?.name || 'RK').substring(0, 2).toUpperCase()}</Text></View>
        <View>
          <Text style={styles.profileName}>{user?.name || 'Rajesh Kumar'}</Text>
          <Text style={styles.profileRole}>Farm Manager</Text>
        </View>
      </View>
      {/* Menu */}
      <View style={styles.menuCard}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={[styles.menuRow, i < menuItems.length - 1 && styles.menuBorder]} onPress={() => navigation.navigate('SettingsDetail', { setting: item.setting, title: item.label })}>
            <MaterialCommunityIcons name={item.icon} size={22} color={COLORS.textSecondary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>
      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())}>
        <MaterialCommunityIcons name="logout" size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Logout</Text>
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
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.danger + '40' },
  logoutText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.danger },
});

export default SettingsMainScreen;
