import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS, TAB_BAR } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { MOCK_SCHEMES, SCHEME_CATEGORIES } from '../mock/schemesMockData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GovernmentSchemesScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredSchemes = useMemo(() => {
    let schemes = MOCK_SCHEMES;

    if (selectedCategory !== 'all') {
      schemes = schemes.filter((s) => s.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      schemes = schemes.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.fullName.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query)
      );
    }

    return schemes;
  }, [searchQuery, selectedCategory]);

  const renderCategoryChip = ({ item }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
        onPress={() => setSelectedCategory(item.id)}
      >
        <MaterialCommunityIcons
          name={item.icon}
          size={16}
          color={isSelected ? COLORS.white : COLORS.textSecondary}
        />
        <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSchemeCard = ({ item }) => (
    <TouchableOpacity
      style={styles.schemeCard}
      onPress={() => navigation.navigate('SchemeDetail', { scheme: item })}
      activeOpacity={0.7}
    >
      <View style={styles.schemeCardRow}>
        <View style={[styles.schemeIconCircle, { backgroundColor: item.color + '20' }]}>
          <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
        </View>
        <View style={styles.schemeCardContent}>
          <View style={styles.schemeTitleRow}>
            <Text style={styles.schemeName} numberOfLines={1}>{item.name}</Text>
            {item.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>
          <Text style={styles.schemeFullName} numberOfLines={1}>{item.fullName}</Text>
          <Text style={styles.schemeDescription} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.schemeBenefits} numberOfLines={1}>{item.benefits}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="file-search-outline" size={56} color={COLORS.textTertiary} />
      <Text style={styles.emptyText}>{t('schemes.noResults', 'No schemes found')}</Text>
    </View>
  );

  const tabBarBottomPadding = TAB_BAR.height + TAB_BAR.marginBottom + Math.max(insets.bottom, 12) + 8;

  return (
    <ScreenLayout
      prefix="Gov"
      title={t('schemes.title', 'Schemes')}
      showBack
      onBack={() => navigation.goBack()}
      scrollable={false}
    >
      <View style={[styles.container, { paddingBottom: tabBarBottomPadding }]}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('schemes.search', 'Search schemes...')}
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Chips */}
        <View style={styles.categoryContainer}>
          <FlatList
            data={SCHEME_CATEGORIES}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          />
        </View>

        {/* Scheme List */}
        <FlatList
          data={filteredSchemes}
          renderItem={renderSchemeCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.schemeList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
        />
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SPACING.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    height: 44,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  categoryContainer: {
    marginBottom: SPACING.md,
  },
  categoryList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    gap: SPACING.xs,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  categoryChipTextSelected: {
    color: COLORS.white,
  },
  schemeList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  schemeCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  schemeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  schemeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schemeCardContent: {
    flex: 1,
  },
  schemeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  schemeName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  newBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  schemeFullName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  schemeDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  schemeBenefits: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primaryLight,
    marginTop: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxxl,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textTertiary,
  },
});

export default GovernmentSchemesScreen;
