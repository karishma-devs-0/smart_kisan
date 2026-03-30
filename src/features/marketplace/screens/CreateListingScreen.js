import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { MOCK_CATEGORIES } from '../mock/marketplaceMockData';
import { createListing } from '../slice/marketplaceSlice';

// ─── Category Selector ─────────────────────────────────────────────────────

const LISTING_CATEGORIES = MOCK_CATEGORIES.filter((c) => c.id !== 'all');

const UNIT_OPTIONS = ['kg', 'quintal', 'ton', 'piece', 'bag', 'bottle', 'set', 'litre', 'dozen boxes'];

// ─── Main Screen ────────────────────────────────────────────────────────────

const CreateListingScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { loading } = useSelector((state) => state.marketplace);

  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const handleSubmit = () => {
    if (!category) {
      Alert.alert(t('marketplace.error', 'Error'), t('marketplace.selectCategory', 'Please select a category'));
      return;
    }
    if (!title.trim()) {
      Alert.alert(t('marketplace.error', 'Error'), t('marketplace.enterTitle', 'Please enter a title'));
      return;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert(t('marketplace.error', 'Error'), t('marketplace.enterPrice', 'Please enter a valid price'));
      return;
    }
    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert(t('marketplace.error', 'Error'), t('marketplace.enterQuantity', 'Please enter a valid quantity'));
      return;
    }

    const listingData = {
      type: category,
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      unit,
      quantity: Number(quantity),
      image: null,
      status: 'active',
      postedDate: new Date().toISOString().split('T')[0],
    };

    dispatch(createListing(listingData))
      .unwrap()
      .then(() => {
        Alert.alert(
          t('marketplace.success', 'Success'),
          t('marketplace.listingCreated', 'Your listing has been posted!'),
          [{ text: t('marketplace.ok', 'OK'), onPress: () => navigation.goBack() }],
        );
      })
      .catch((err) => {
        Alert.alert(t('marketplace.error', 'Error'), err);
      });
  };

  return (
    <ScreenLayout
      title={t('marketplace.createListing', 'Create Listing')}
      showBack
      onBack={() => navigation.goBack()}
    >
      {/* Category Picker */}
      <Text style={styles.label}>{t('marketplace.category', 'Category')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        contentContainerStyle={styles.categoryRowContent}
      >
        {LISTING_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, category === cat.id && styles.categoryChipSelected]}
            onPress={() => setCategory(cat.id)}
          >
            <MaterialCommunityIcons
              name={cat.icon}
              size={20}
              color={category === cat.id ? COLORS.white : COLORS.textSecondary}
            />
            <Text style={[styles.categoryChipText, category === cat.id && styles.categoryChipTextSelected]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Title */}
      <Text style={styles.label}>{t('marketplace.listingTitle', 'Title')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('marketplace.titlePlaceholder', 'e.g., Organic Basmati Rice')}
        placeholderTextColor={COLORS.textTertiary}
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />

      {/* Description */}
      <Text style={styles.label}>{t('marketplace.description', 'Description')}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder={t('marketplace.descriptionPlaceholder', 'Describe your product, quality, origin...')}
        placeholderTextColor={COLORS.textTertiary}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        maxLength={500}
      />

      {/* Price & Quantity Row */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('marketplace.price', 'Price')} ({'\u20B9'})</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={COLORS.textTertiary}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('marketplace.quantity', 'Quantity')}</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={COLORS.textTertiary}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Unit Picker */}
      <Text style={styles.label}>{t('marketplace.unit', 'Unit')}</Text>
      <TouchableOpacity
        style={styles.unitSelector}
        onPress={() => setShowUnitPicker(!showUnitPicker)}
      >
        <Text style={styles.unitSelectorText}>{unit}</Text>
        <MaterialCommunityIcons
          name={showUnitPicker ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
      {showUnitPicker && (
        <View style={styles.unitDropdown}>
          {UNIT_OPTIONS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitOption, unit === u && styles.unitOptionSelected]}
              onPress={() => {
                setUnit(u);
                setShowUnitPicker(false);
              }}
            >
              <Text style={[styles.unitOptionText, unit === u && styles.unitOptionTextSelected]}>
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Image Picker Placeholder */}
      <Text style={styles.label}>{t('marketplace.images', 'Images')}</Text>
      <TouchableOpacity style={styles.imagePicker}>
        <MaterialCommunityIcons name="camera-plus" size={32} color={COLORS.textTertiary} />
        <Text style={styles.imagePickerText}>
          {t('marketplace.addPhotos', 'Tap to add photos')}
        </Text>
        <Text style={styles.imagePickerSubtext}>
          {t('marketplace.comingSoon', 'Coming soon')}
        </Text>
      </TouchableOpacity>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.white} />
            <Text style={styles.submitButtonText}>
              {t('marketplace.postListing', 'Post Listing')}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScreenLayout>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfField: {
    flex: 1,
  },
  categoryRow: {
    marginHorizontal: -SPACING.lg,
  },
  categoryRowContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  categoryChipTextSelected: {
    color: COLORS.white,
  },
  unitSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitSelectorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  unitDropdown: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
    padding: SPACING.xs,
    ...SHADOWS.md,
  },
  unitOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  unitOptionSelected: {
    backgroundColor: COLORS.primarySurface,
  },
  unitOptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  unitOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  imagePickerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
  },
  imagePickerSubtext: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxxl,
    gap: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
});

export default CreateListingScreen;
