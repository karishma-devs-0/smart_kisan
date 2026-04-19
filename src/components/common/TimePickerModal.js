import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import ScrollPicker from './ScrollPicker';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../constants/layout';

const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
const HOURS_100 = Array.from({ length: 100 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const SECONDS = Array.from({ length: 60 }, (_, i) => i);

const TimePickerModal = ({
  visible,
  onClose,
  onConfirm,
  title = 'Set Time',
  initialHours = 0,
  initialMinutes = 0,
  initialSeconds = 0,
  showSeconds = false,
  maxHours = 23,
}) => {
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);

  // Reset when modal opens with new initial values
  useEffect(() => {
    if (visible) {
      setHours(initialHours);
      setMinutes(initialMinutes);
      setSeconds(initialSeconds);
    }
  }, [visible, initialHours, initialMinutes, initialSeconds]);

  const hourValues = maxHours > 23 ? HOURS_100 : HOURS_24;

  const handleConfirm = () => {
    onConfirm({ hours, minutes, seconds });
    onClose();
  };

  const padTwo = (n) => String(n).padStart(2, '0');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop — tap to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Content card — does NOT intercept scroll events */}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>

          <Text style={styles.preview}>
            {padTwo(hours)}:{padTwo(minutes)}
            {showSeconds ? `:${padTwo(seconds)}` : ''}
          </Text>

          {/* Scroll wheels */}
          <View style={styles.pickersRow}>
            <ScrollPicker
              values={hourValues}
              selectedValue={hours}
              onValueChange={setHours}
              label={showSeconds ? 'HRS' : 'HOUR'}
              width={showSeconds ? 70 : 85}
            />
            <Text style={styles.colon}>:</Text>
            <ScrollPicker
              values={MINUTES}
              selectedValue={minutes}
              onValueChange={setMinutes}
              label="MIN"
              width={showSeconds ? 70 : 85}
            />
            {showSeconds && (
              <>
                <Text style={styles.colon}>:</Text>
                <ScrollPicker
                  values={SECONDS}
                  selectedValue={seconds}
                  onValueChange={setSeconds}
                  label="SEC"
                  width={70}
                />
              </>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xxl,
    width: '85%',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  preview: {
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  pickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  colon: {
    fontSize: 30,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginHorizontal: 4,
    marginTop: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default TimePickerModal;
