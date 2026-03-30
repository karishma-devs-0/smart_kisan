import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { updateProfile } from '../../auth/slice/authSlice';

const UserProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const loading = useSelector((s) => s.auth.loading);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [farmName, setFarmName] = useState(user?.farmName || '');
  const [location, setLocation] = useState(user?.location || '');
  const [avatar, setAvatar] = useState(user?.avatar || null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setFarmName(user.farmName || '');
      setLocation(user.location || '');
      setAvatar(user.avatar || null);
    }
  }, [user]);

  const getInitials = () => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), 'Camera roll permission is required to change your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('register.errors.nameRequired'));
      return;
    }

    try {
      await dispatch(
        updateProfile({
          name: name.trim(),
          phone: phone.trim(),
          farmName: farmName.trim(),
          location: location.trim(),
          avatar,
        }),
      ).unwrap();
      Alert.alert(t('common.ok'), t('profile.saved'));
    } catch (err) {
      Alert.alert(t('common.error'), err || 'Failed to update profile.');
    }
  };

  return (
    <ScreenLayout
      title={t('profile.title', 'My Profile')}
      showBack
      onBack={() => navigation.goBack()}
      scrollable
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{getInitials()}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <MaterialCommunityIcons name="camera" size={16} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickImage}>
            <Text style={styles.changePhotoText}>{t('profile.changePhoto', 'Change Photo')}</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formCard}>
          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('profile.name', 'Full Name')}</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="account-outline" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('profile.name', 'Full Name')}
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
          </View>

          {/* Email (read-only) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('profile.email', 'Email')}</Text>
            <View style={[styles.inputRow, styles.inputDisabled]}>
              <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={[styles.input, { color: COLORS.textTertiary }]}
                value={user?.email || ''}
                editable={false}
              />
              <MaterialCommunityIcons name="lock-outline" size={16} color={COLORS.textTertiary} />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('profile.phone', 'Phone Number')}</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="phone-outline" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder={t('profile.phone', 'Phone Number')}
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Farm Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('profile.farmName', 'Farm Name')}</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="barn" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                value={farmName}
                onChangeText={setFarmName}
                placeholder={t('profile.farmName', 'Farm Name')}
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
          </View>

          {/* Farm Location */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('profile.location', 'Farm Location')}</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder={t('profile.location', 'Farm Location')}
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-outline" size={20} color={COLORS.white} />
              <Text style={styles.saveButtonText}>{t('profile.save', 'Save Changes')}</Text>
            </>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  avatarInitials: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  changePhotoText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  formCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  inputDisabled: {
    backgroundColor: COLORS.divider,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
});

export default UserProfileScreen;
