import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { MOCK_CATEGORIES } from '../mock/marketplaceMockData';
import {
  fetchListings,
  fetchMandiPrices,
  setSelectedCategory,
} from '../slice/marketplaceSlice';

// ─── Category Chip ──────────────────────────────────────────────────────────

const CategoryChip = ({ category, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, isSelected && styles.chipSelected]}
    onPress={onPress}
  >
    <MaterialCommunityIcons
      name={category.icon}
      size={16}
      color={isSelected ? COLORS.white : COLORS.textSecondary}
    />
    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
      {category.name}
    </Text>
  </TouchableOpacity>
);

// ─── Mandi Price Row ────────────────────────────────────────────────────────

const MandiPriceRow = ({ item }) => {
  const isUp = item.trend === 'up';
  const isDown = item.trend === 'down';
  const changeColor = isUp ? COLORS.success : isDown ? COLORS.danger : COLORS.textTertiary;
  const trendIcon = isUp ? 'trending-up' : isDown ? 'trending-down' : 'trending-neutral';

  return (
    <View style={styles.mandiRow}>
      <View style={styles.mandiLeft}>
        <Text style={styles.mandiCommodity}>{item.commodity}</Text>
        <Text style={styles.mandiMarket}>{item.market}</Text>
      </View>
      <View style={styles.mandiRight}>
        <Text style={styles.mandiPrice}>{'\u20B9'}{item.price}/q</Text>
        <View style={styles.mandiChange}>
          <MaterialCommunityIcons name={trendIcon} size={14} color={changeColor} />
          <Text style={[styles.mandiChangeText, { color: changeColor }]}>
            {isUp ? '+' : ''}{item.change}%
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── Listing Card ───────────────────────────────────────────────────────────

const ListingCard = ({ item, onPress }) => {
  const typeIcons = { crop: 'sprout', input: 'flask', equipment: 'tractor' };
  const typeColors = { crop: COLORS.success, input: COLORS.info, equipment: COLORS.warning };

  return (
    <TouchableOpacity style={styles.listingCard} onPress={onPress}>
      <View style={[styles.listingImagePlaceholder, { backgroundColor: (typeColors[item.type] || COLORS.primary) + '15' }]}>
        <MaterialCommunityIcons
          name={typeIcons[item.type] || 'package-variant'}
          size={32}
          color={typeColors[item.type] || COLORS.primary}
        />
      </View>
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.listingPrice}>{'\u20B9'}{item.price.toLocaleString('en-IN')}/{item.unit}</Text>
        <View style={styles.listingMeta}>
          <MaterialCommunityIcons name="map-marker-outline" size={12} color={COLORS.textTertiary} />
          <Text style={styles.listingLocation} numberOfLines={1}>{item.seller.location}</Text>
        </View>
        <Text style={styles.listingDate}>{item.postedDate}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ────────────────────────────────────────────────────────────

const MarketplaceHomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { listings, mandiPrices, selectedCategory, loading } = useSelector(
    (state) => state.marketplace,
  );
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    dispatch(fetchListings());
    dispatch(fetchMandiPrices());
  }, [dispatch]);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([
      dispatch(fetchListings()),
      dispatch(fetchMandiPrices()),
    ]).finally(() => setRefreshing(false));
  };

  const filteredListings = selectedCategory === 'all'
    ? listings
    : listings.filter((item) => item.type === selectedCategory);

  const topMandiPrices = mandiPrices.slice(0, 5);

  return (
    <ScreenLayout
      title={t('marketplace.title', 'Marketplace')}
      rightActions={[
        {
          icon: 'message-text-outline',
          onPress: () => navigation.navigate('ChatList'),
        },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
      renderBottomOverlay={({ tabBarBottomPadding }) => (
        <TouchableOpacity
          style={[styles.fab, { bottom: tabBarBottomPadding + SPACING.lg }]}
          onPress={() => navigation.navigate('CreateListing')}
        >
          <MaterialCommunityIcons name="plus" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}
    >
      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {MOCK_CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.id}
            category={cat}
            isSelected={selectedCategory === cat.id}
            onPress={() => dispatch(setSelectedCategory(cat.id))}
          />
        ))}
      </ScrollView>

      {/* Mandi Prices Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('marketplace.mandiPrices', 'Mandi Prices')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MandiPrices')}>
            <Text style={styles.seeAll}>{t('marketplace.seeAll', 'See All')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.mandiCard}>
          {topMandiPrices.map((item) => (
            <MandiPriceRow key={item.id} item={item} />
          ))}
        </View>
      </View>

      {/* Recent Listings Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('marketplace.recentListings', 'Recent Listings')}</Text>
        </View>
        {loading && listings.length === 0 ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
        ) : (
          filteredListings.map((item) => (
            <ListingCard
              key={item.id}
              item={item}
              onPress={() => navigation.navigate('ListingDetail', { listing: item })}
            />
          ))
        )}
        {!loading && filteredListings.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="package-variant" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>{t('marketplace.noListings', 'No listings found')}</Text>
          </View>
        )}
      </View>
    </ScreenLayout>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  chipRow: {
    marginBottom: SPACING.lg,
    marginHorizontal: -SPACING.lg,
  },
  chipRowContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    gap: SPACING.xs,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.white,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  seeAll: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  mandiCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  mandiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  mandiLeft: {
    flex: 1,
  },
  mandiCommodity: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  mandiMarket: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  mandiRight: {
    alignItems: 'flex-end',
  },
  mandiPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  mandiChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  mandiChangeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  listingImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  listingInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  listingTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  listingPrice: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: 4,
  },
  listingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listingLocation: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    flex: 1,
  },
  listingDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textTertiary,
    marginTop: SPACING.md,
  },
});

export default MarketplaceHomeScreen;
