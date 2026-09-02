/**
 * Adding a farm task.
 *
 * The plus button used to open an alert that said the feature was coming, so
 * the task list could only ever show what was already there — which, before
 * this, was a fixed set of samples.
 *
 * Only a title is required. A farmer standing in a field should be able to
 * note "spray field B" in a few seconds; everything else is optional and can
 * be left alone.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';

const CATEGORIES = [
  { id: 'sowing', icon: 'seed', label: 'Sowing' },
  { id: 'harvesting', icon: 'basket', label: 'Harvesting' },
  { id: 'irrigation', icon: 'water', label: 'Irrigation' },
  { id: 'fertilizing', icon: 'bottle-tonic', label: 'Fertilizing' },
  { id: 'pest-control', icon: 'bug', label: 'Pest Control' },
  { id: 'maintenance', icon: 'wrench', label: 'Maintenance' },
  { id: 'other', icon: 'clipboard-text', label: 'Other' },
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: COLORS.info },
  { id: 'medium', label: 'Medium', color: COLORS.warning },
  { id: 'high', label: 'High', color: COLORS.danger },
];

// Typing a date on a phone is slow and easy to get wrong, so the common
// choices are offered directly. "No date" is first because most jobs noted in
// passing do not have one.
const DUE_OPTIONS = [
  { id: 'none', label: 'No date', days: null },
  { id: 'today', label: 'Today', days: 0 },
  { id: 'tomorrow', label: 'Tomorrow', days: 1 },
  { id: 'week', label: 'In a week', days: 7 },
];

const dueDateFrom = (days) => {
  if (days === null) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  // End of the chosen day, so a task due "today" is not already overdue.
  d.setHours(23, 59, 0, 0);
  return d.toISOString();
};

const AddTaskModal = ({ visible, onClose, onSubmit, saving, fields = [] }) => {
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [priority, setPriority] = useState('medium');
  const [due, setDue] = useState('none');
  const [fieldName, setFieldName] = useState('');
  const [error, setError] = useState(null);

  const reset = () => {
    setTitle('');
    setDescription('');
    setCategory('other');
    setPriority('medium');
    setDue('none');
    setFieldName('');
    setError(null);
  };

  const close = () => {
    reset();
    onClose?.();
  };

  const submit = () => {
    if (!title.trim()) {
      setError(t('tasks.titleRequired', 'Give the task a name'));
      return;
    }
    setError(null);
    onSubmit?.({
      title: title.trim(),
      description: description.trim() || null,
      category,
      priority,
      dueDate: dueDateFrom(DUE_OPTIONS.find((o) => o.id === due)?.days ?? null),
      fieldName: fieldName.trim() || null,
      status: 'active',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{t('tasks.addTask', 'Add Task')}</Text>
            <TouchableOpacity onPress={close} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>{t('tasks.taskTitle', 'What needs doing?')}</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={(v) => {
                setTitle(v);
                setError(null);
              }}
              placeholder={t('tasks.titlePlaceholder', 'e.g. Spray field B')}
              placeholderTextColor={COLORS.textTertiary}
              autoFocus
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.label}>{t('tasks.category', 'Type of work')}</Text>
            <View style={styles.chipWrap}>
              {CATEGORIES.map((c) => {
                const on = category === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => setCategory(c.id)}
                  >
                    <MaterialCommunityIcons
                      name={c.icon}
                      size={15}
                      color={on ? COLORS.white : COLORS.textSecondary}
                    />
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>{t('tasks.priority', 'Priority')}</Text>
            <View style={styles.chipWrap}>
              {PRIORITIES.map((pr) => {
                const on = priority === pr.id;
                return (
                  <TouchableOpacity
                    key={pr.id}
                    style={[styles.chip, on && { backgroundColor: pr.color, borderColor: pr.color }]}
                    onPress={() => setPriority(pr.id)}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{pr.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>{t('tasks.dueDate', 'Due')}</Text>
            <View style={styles.chipWrap}>
              {DUE_OPTIONS.map((o) => {
                const on = due === o.id;
                return (
                  <TouchableOpacity
                    key={o.id}
                    style={[styles.chip, on && styles.chipOn]}
                    onPress={() => setDue(o.id)}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {fields.length > 0 && (
              <>
                <Text style={styles.label}>{t('tasks.field', 'Field')}</Text>
                <View style={styles.chipWrap}>
                  {fields.map((f) => {
                    const on = fieldName === f.name;
                    return (
                      <TouchableOpacity
                        key={f.id ?? f.name}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() => setFieldName(on ? '' : f.name)}
                      >
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={styles.label}>{t('tasks.notes', 'Notes')}</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('tasks.notesPlaceholder', 'Optional')}
              placeholderTextColor={COLORS.textTertiary}
              multiline
            />

            <TouchableOpacity style={styles.primary} onPress={submit} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryText}>{t('tasks.save', 'Add Task')}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: 52,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  multiline: { height: 88, paddingTop: SPACING.md, textAlignVertical: 'top' },
  error: { fontSize: FONT_SIZES.sm, color: COLORS.danger, marginTop: SPACING.xs },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full ?? 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: COLORS.white,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  chipTextOn: { color: COLORS.white, fontWeight: FONT_WEIGHTS.medium },
  primary: {
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
  },
  primaryText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
});

export default AddTaskModal;
