import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';

const PhoneLoginForm = ({ onLogin, loading }) => {
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = () => {
    setOtpSent(true);
  };

  const handleVerify = () => {
    onLogin({ phone: `${countryCode}${phone}`, otp });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Phone Number</Text>
      <View style={styles.phoneRow}>
        <TouchableOpacity style={styles.countryCodeContainer}>
          <Text style={styles.flag}>🇮🇳</Text>
          <Text style={styles.countryCode}>{countryCode}</Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={COLORS.textTertiary} />
        </TouchableOpacity>
        <View style={styles.phoneInputContainer}>
          <TextInput
            style={styles.phoneInput}
            placeholder="Phone number"
            placeholderTextColor={COLORS.textTertiary}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
      </View>

      {!otpSent ? (
        <TouchableOpacity
          style={[styles.sendOtpButton, !phone && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={!phone}
        >
          <Text style={styles.sendOtpText}>Send OTP</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.label}>OTP</Text>
          <View style={styles.otpContainer}>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={COLORS.textTertiary}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <View style={styles.row}>
            <TouchableOpacity>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.linkText}>Local Mode</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>{loading ? 'Verifying...' : 'Login'}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  phoneRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 52,
    gap: 4,
  },
  flag: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  phoneInputContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: 52,
    justifyContent: 'center',
  },
  phoneInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  sendOtpButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  sendOtpText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  otpContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: 52,
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  otpInput: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    letterSpacing: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxl,
  },
  linkText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
});

export default PhoneLoginForm;
