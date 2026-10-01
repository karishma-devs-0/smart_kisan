/**
 * Recording a harvest.
 *
 * Only the crop and the quantity are required. A farmer standing at the edge
 * of a field with a loaded trolley should be able to note it in a few taps;
 * the area, quality and expectation are useful but never in the way.
 *
 * Picking the crop from the ones already sown fills in the field, variety and
 * area by itself, so the common case is three taps and a number.
 */
import React, { useState, useEffect } from 'react';
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
import DictateButton, { appendSpoken } from '../../../components/common/DictateButton';

// Quintal first: it is what mandi prices and yields are quoted in. Maund is
// still in everyday use across north India.
const UNITS = ['quintal', 'kg', 'tonne', 'maund'];
const AREA_UNITS = ['acre', 'bigha', 'hectare'];
const QUALITY = [
  { id: 'premium', label: 'Premium' },
  { id: 'good', label: 'Good' },
  { id: 'average', label: 'Average' },
  { id: 'poor', label: 'Poor' },
];

const WHEN = [
  { id: 'today', label: 'Today', days: 0 },
  { id: 'yesterday', label: 'Yesterday', days: 1 },
  { id: 'week', label: 'Last week', days: 7 },
];

const dateFrom = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const RecordHarvestModal = ({ visible, onClose, onSubmit, saving, crops = [], fields = [] }) => {
  const { t } = useTranslation();

  const [cropId, setCropId] = useState(null);
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('quintal');
  const [area, setArea] = useState('');
  const [areaUnit, setAreaUnit] = useState('acre');
  const [quality, setQuality] = useState('good');
  const [when, setWhen] = useState('today');
  const [expected, setExpected] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  const reset = () => {
    setCropId(null); setCropName(''); setQuantity(''); setUnit('quintal');
    setArea(''); setAreaUnit('acre'); setQuality('good'); setWhen('today');
    setExpected(''); setNotes(''); setError(null);
  };

  useEffect(() => { if (!visible) reset(); }, [visible]);

  const selected = crops.find((c) => c.id === cropId) || null;
  const field = selected ? fields.find((f) => f.id === selected.fieldId) : null;

  // Choosing a sown crop carries its details across, so they are not typed
  // again and cannot disagree with the crop record.
  const pickCrop = (crop) => {
    if (cropId === crop.id) {
      setCropId(null);
      return;
    }
    setCropId(crop.id);
    setCropName(crop.name || '');
    if (crop.area) setArea(String(crop.area));
    setError(null);
  };

  const submit = () => {
    const name = (selected?.name || cropName).trim();
    if (!name) {
      setError(t('harvests.needCrop', 'Choose a crop, or type its name'));
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError(t('harvests.needQuantity', 'Enter how much was harvested'));
      return;
    }
    setError(null);

    const areaNum = Number(area);
    const expectedNum = Number(expected);

    onSubmit?.({
      cropId: selected?.id || null,
      fieldId: selected?.fieldId || null,
      cropName: name,
      variety: selected?.variety || null,
      fieldName: field?.name || null,
      season: selected?.season || null,
      sownOn: selected?.sownOn || null,
      harvestedOn: dateFrom(WHEN.find((w) => w.id === when)?.days ?? 0),
      quantity: qty,
      unit,
      area: Number.isFinite(areaNum) && areaNum > 0 ? areaNum : null,
      areaUnit,
      quality,
      expectedQuintals: Number.isFinite(expectedNum) && expectedNum > 0 ? expectedNum : null,
      notes: notes.trim() || null,
    });
  };

  const Chips = ({ options, value, onPick, keyOf = (o) => o, labelOf = (o) => o }) => (
    <View style={styles.chipWrap}>
      {options.map((o) => {
        const k = keyOf(o);
        const on = value === k;
        return (
          <TouchableOpacity
            key={k}
            style={[styles.chip, on && styles.chipOn]}
            onPress={() => onPick(k)}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{labelOf(o)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{t('harvests.record', 'Record a harvest')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {crops.length > 0 && (
              <>
                <Text style={styles.label}>{t('harvests.whichCrop', 'Which crop?')}</Text>
                <View style={styles.chipWrap}>
                  {crops.map((c) => {
                    const on = cropId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() => pickCrop(c)}
                      >
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {!cropId && (
              <>
                <Text style={styles.label}>
                  {crops.length
                    ? t('harvests.orType', 'Or type the crop name')
                    : t('harvests.cropName', 'Crop name')}
                </Text>
                <TextInput
                  style={styles.input}
                  value={cropName}
                  onChangeText={(v) => { setCropName(v); setError(null); }}
                  placeholder={t('harvests.cropPlaceholder', 'e.g. Wheat')}
                  placeholderTextColor={COLORS.textTertiary}
                />
              </>
            )}

            <Text style={styles.label}>{t('harvests.howMuch', 'How much came off?')}</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flex]}
                value={quantity}
                onChangeText={(v) => { setQuantity(v); setError(null); }}
                placeholder="0"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
            <Chips options={UNITS} value={unit} onPick={setUnit} />

            <Text style={styles.label}>
              {t('harvests.areaHarvested', 'Area harvested')}
              <Text style={styles.optional}>  {t('harvests.optional', 'optional')}</Text>
            </Text>
            <Text style={styles.hint}>
              {t('harvests.areaHint',
                'Needed to work out yield per acre, which is how seasons compare.')}
            </Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flex]}
                value={area}
                onChangeText={setArea}
                placeholder="0"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
            <Chips options={AREA_UNITS} value={areaUnit} onPick={setAreaUnit} />

            <Text style={styles.label}>{t('harvests.when', 'When?')}</Text>
            <Chips
              options={WHEN}
              value={when}
              onPick={setWhen}
              keyOf={(o) => o.id}
              labelOf={(o) => o.label}
            />

            <Text style={styles.label}>{t('harvests.quality', 'Quality')}</Text>
            <Chips
              options={QUALITY}
              value={quality}
              onPick={setQuality}
              keyOf={(o) => o.id}
              labelOf={(o) => o.label}
            />

            <Text style={styles.label}>
              {t('harvests.expected', 'What did you expect?')}
              <Text style={styles.optional}>  {t('harvests.optional', 'optional')}</Text>
            </Text>
            <Text style={styles.hint}>
              {t('harvests.expectedHint',
                'In quintals. Only records with an expectation can show how close '
                + 'the harvest came to it.')}
            </Text>
            <TextInput
              style={styles.input}
              value={expected}
              onChangeText={setExpected}
              placeholder="0"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>
              {t('harvests.notes', 'Notes')}
              <Text style={styles.optional}>  {t('harvests.optional', 'optional')}</Text>
            </Text>
            {/* Notes only. The quantity above stays typed: "sixteen quintal"
                heard as sixty would be saved and every yield figure and
                prediction after it built on the wrong number, where a note is
                read back before it counts. */}
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.multiline, styles.inputFlex]}
                value={notes}
                onChangeText={setNotes}
                placeholder={t('harvests.notesPlaceholder', 'Anything worth remembering next season')}
                placeholderTextColor={COLORS.textTertiary}
                multiline
              />
              <DictateButton
                onText={(spoken) => setNotes((c) => appendSpoken(c, spoken))}
                style={styles.dictateTop}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.primary} onPress={submit} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryText}>{t('harvests.save', 'Save harvest')}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  inputFlex: { flex: 1 },
  dictateTop: { alignSelf: 'flex-start', marginTop: SPACING.md },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    maxHeight: '92%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0',
    alignSelf: 'center', marginTop: SPACING.md, marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: SPACING.md,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  label: {
    fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary, marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
  optional: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, fontWeight: FONT_WEIGHTS.regular },
  hint: {
    fontSize: FONT_SIZES.xs, color: COLORS.textTertiary,
    marginTop: -SPACING.xs, marginBottom: SPACING.sm, lineHeight: 15,
  },
  row: { flexDirection: 'row', gap: SPACING.sm },
  flex: { flex: 1 },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: 50,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  multiline: { height: 78, paddingTop: SPACING.md, textAlignVertical: 'top' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0',
    backgroundColor: COLORS.white,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  chipTextOn: { color: COLORS.white, fontWeight: FONT_WEIGHTS.medium },
  error: { fontSize: FONT_SIZES.sm, color: COLORS.danger, marginTop: SPACING.md },
  primary: {
    height: 52, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xxl,
  },
  primaryText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold },
});

export default RecordHarvestModal;
