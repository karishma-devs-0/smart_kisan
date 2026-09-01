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

  // The farm name and location are collected during onboarding and stored on
  // the farm profile, not the user. This screen used to read them off
  // `auth.user`, which only carries id, name and email — so both fields were
  // always undefined and the form opened blank however much had been entered
  // at setup. That is the "not showing the data" in the report.
  const farmProfile = useSelector((s) => s.onboarding.profile);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [farmName, setFarmName] = useState(farmProfile?.farmName || '');
  const [location, setLocation] = useState(farmProfile?.locationName || '');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || null);
    }
  }, [user]);

  // Kept separate from the user effect: the profile arrives from its own fetch
  // and usually lands after the user does, so a combined effect would clear
  // whichever half had not resolved yet.
  useEffect(() => {
    if (farmProfile) {
      setFarmName(farmProfile.farmName || '');
      // location is an object elsewhere in the profile; the editable field is
      // the place name.
      setLocation(farmProfile.locationName || farmProfile.location?.name || '');
    }
  }, [farmProfile]);

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

  // Same rule the sign-up form applies: ten digits starting 6-9, after
  // stripping the +91/0 prefix and any spaces or dashes people type. Worth
  // enforcing here too, because this is the number a future SMS sign-in and
  // any alert would go to.
  const isIndianMobile = (raw) => {
    const digits = raw.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '');
    return /^[6-9]\d{9}$/.test(digits);
  };

  const validate = () => {
    const next = {};

    if (!name.trim()) {
      next.name = t('register.errors.nameRequired');
    } else if (name.trim().length < 2) {
      next.name = t('profile.errors.nameTooShort', 'Name must be at least 2 characters');
    }

    // Optional, but not allowed to be wrong if given.
    if (phone.trim() && !isIndianMobile(phone)) {
      next.phone = t('register.errors.phoneInvalid', 'Enter a valid 10-digit mobile number');
    }

    if (farmName.trim() && farmName.trim().length < 2) {
      next.farmName = t('profile.errors.farmNameTooShort', 'Farm name must be at least 2 characters');
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      await dispatch(
        updateProfile({
          name: name.trim(),
          phone: phone.trim(),
          farmName: farmName.trim(),
          // The server stores the place name on the profile as location_name.
          locationName: location.trim(),
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
                onChangeText={(v) => {
                  setName(v);
                  if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                }}
                placeholder={t('profile.name', 'Full Name')}
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
            {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
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
                onChangeText={(v) => {
                  setPhone(v);
                  if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
                }}
                placeholder={t('profile.phone', 'Phone Number')}
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="phone-pad"
                maxLength={14}
              />
            </View>
            {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Farm Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('profile.farmName', 'Farm Name')}</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="barn" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                value={farmName}
                onChangeText={(v) => {
                  setFarmName(v);
                  if (errors.farmName) setErrors((e) => ({ ...e, farmName: undefined }));
                }}
                placeholder={t('profile.farmName', 'Farm Name')}
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
            {!!errors.farmName && <Text style={styles.errorText}>{errors.farmName}</Text>}
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
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
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
