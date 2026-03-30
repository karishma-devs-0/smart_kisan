import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { fetchMandiPrices, addPriceAlert, removePriceAlert } from '../slice/marketplaceSlice';

// ─── Sort Options ───────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { key: 'commodity', label: 'Name' },
  { key: 'price', label: 'Price' },
  { key: 'change', label: 'Change %' },
];

// ─── Price Card ─────────────────────────────────────────────────────────────

const PriceCard = ({ item, hasAlert, onBellPress }) => {
  const isUp = item.trend === 'up';
  const isDown = item.trend === 'down';
  const changeColor = isUp ? COLORS.success : isDown ? COLORS.danger : COLORS.textTertiary;
  const trendIcon = isUp ? 'trending-up' : isDown ? 'trending-down' : 'trending-neutral';
  const bgTint = isUp ? COLORS.success + '10' : isDown ? COLORS.danger + '10' : COLORS.background;

  return (
    <View style={[styles.priceCard, { borderLeftColor: changeColor }]}>
      <View style={styles.priceCardTop}>
        <View style={styles.priceCardLeft}>
          <View style={styles.commodityRow}>
            <Text style={styles.commodity}>{item.commodity}</Text>
            {hasAlert && (
              <View style={styles.alertDot} />
            )}
          </View>
          <Text style={styles.variety}>{item.variety}</Text>
        </View>
        <View style={styles.priceCardRightRow}>
          <View style={styles.priceCardRight}>
            <Text style={styles.price}>{'\u20B9'}{item.price.toLocaleString('en-IN')}</Text>
            <Text style={styles.perUnit}>per quintal</Text>
          </View>
          <TouchableOpacity onPress={onBellPress} style={styles.bellBtn}>
            <MaterialCommunityIcons
              name={hasAlert ? 'bell-ring' : 'bell-outline'}
              size={20}
              color={hasAlert ? COLORS.warning : COLORS.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.priceCardBottom}>
        <View style={styles.marketInfo}>
          <MaterialCommunityIcons name="store" size={12} color={COLORS.textTertiary} />
          <Text style={styles.marketText}>{item.market}, {item.state}</Text>
        </View>
        <View style={[styles.changeBadge, { backgroundColor: bgTint }]}>
          <MaterialCommunityIcons name={trendIcon} size={14} color={changeColor} />
          <Text style={[styles.changeText, { color: changeColor }]}>
            {isUp ? '+' : ''}{item.change}%
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main Screen ────────────────────────────────────────────────────────────

const MandiPricesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { mandiPrices, priceAlerts, loading } = useSelector((state) => state.marketplace);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('commodity');
  const [refreshing, setRefreshing] = useState(false);
  const [alertModal, setAlertModal] = useState({ visible: false, commodity: '', currentPrice: 0 });
  const [targetPriceInput, setTargetPriceInput] = useState('');

  useEffect(() => {
    if (mandiPrices.length === 0) {
      dispatch(fetchMandiPrices());
    }
  }, [dispatch, mandiPrices.length]);

  const onRefresh = () => {
    setRefreshing(true);
    dispatch(fetchMandiPrices()).finally(() => setRefreshing(false));
  };

  const getAlertForCommodity = useCallback(
    (commodity) => priceAlerts.find((a) => a.commodity === commodity),
    [priceAlerts],
  );

  const handleBellPress = (item) => {
    const existing = getAlertForCommodity(item.commodity);
    if (existing) {
      dispatch(removePriceAlert(item.commodity));
    } else {
      setTargetPriceInput('');
      setAlertModal({ visible: true, commodity: item.commodity, currentPrice: item.price });
    }
  };

  const handleSetAlert = () => {
    const price = parseFloat(targetPriceInput);
    if (!price || price <= 0) return;
    dispatch(addPriceAlert({ commodity: alertModal.commodity, targetPrice: price }));
    setAlertModal({ visible: false, commodity: '', currentPrice: 0 });
    setTargetPriceInput('');
  };

  const filteredPrices = mandiPrices
    .filter((item) =>
      item.commodity.toLowerCase().includes(search.toLowerCase()) ||
      item.variety.toLowerCase().includes(search.toLowerCase()) ||
      item.market.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'change') return Math.abs(b.change) - Math.abs(a.change);
      return a.commodity.localeCompare(b.commodity);
    });

  const renderActiveAlerts = () => {
    if (priceAlerts.length === 0) return null;
    return (
      <View style={styles.alertsSection}>
        <View style={styles.alertsSectionHeader}>
          <MaterialCommunityIcons name="bell-ring" size={16} color={COLORS.warning} />
          <Text style={styles.alertsSectionTitle}>
            {t('marketplace.activeAlerts', 'Active Alerts')} ({priceAlerts.length})
          </Text>
        </View>
        {priceAlerts.map((alert) => (
          <View key={alert.commodity} style={styles.alertRow}>
            <View style={styles.alertInfo}>
              <Text style={styles.alertCommodity}>{alert.commodity}</Text>
              <Text style={styles.alertTarget}>
                {t('marketplace.targetPrice', 'Target')}: {'\u20B9'}{alert.targetPrice.toLocaleString('en-IN')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => dispatch(removePriceAlert(alert.commodity))}
              style={styles.alertRemoveBtn}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScreenLayout
      title={t('marketplace.mandiPrices', 'Mandi Prices')}
      showBack
      onBack={() => navigation.goBack()}
      scrollable={false}
    >
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('marketplace.searchCommodity', 'Search commodity...')}
            placeholderTextColor={COLORS.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Options */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>{t('marketplace.sortBy', 'Sort by')}:</Text>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.sortChip, sortBy === option.key && styles.sortChipActive]}
              onPress={() => setSortBy(option.key)}
            >
              <Text style={[styles.sortChipText, sortBy === option.key && styles.sortChipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price List */}
        {loading && mandiPrices.length === 0 ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xxxl }} />
        ) : (
          <FlatList
            data={filteredPrices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PriceCard
                item={item}
                hasAlert={!!getAlertForCommodity(item.commodity)}
                onBellPress={() => handleBellPress(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderActiveAlerts}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="chart-line" size={48} color={COLORS.textTertiary} />
                <Text style={styles.emptyText}>
                  {t('marketplace.noPrices', 'No prices found')}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Price Alert Modal */}
      <Modal
        visible={alertModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertModal({ visible: false, commodity: '', currentPrice: 0 })}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="bell-plus" size={24} color={COLORS.warning} />
              <Text style={styles.modalTitle}>
                {t('marketplace.setPriceAlert', 'Set Price Alert')}
              </Text>
            </View>
            <Text style={styles.modalCommodity}>{alertModal.commodity}</Text>
            <Text style={styles.modalCurrentPrice}>
              {t('marketplace.currentPrice', 'Current price')}: {'\u20B9'}{alertModal.currentPrice.toLocaleString('en-IN')}/quintal
            </Text>
            <Text style={styles.modalInputLabel}>
              {t('marketplace.alertWhenReaches', 'Alert when price reaches')}:
            </Text>
            <View style={styles.modalInputRow}>
              <Text style={styles.rupeePrefix}>{'\u20B9'}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
                value={targetPriceInput}
                onChangeText={setTargetPriceInput}
                autoFocus
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAlertModal({ visible: false, commodity: '', currentPrice: 0 })}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSetBtn, !targetPriceInput && styles.modalSetBtnDisabled]}
                onPress={handleSetAlert}
                disabled={!targetPriceInput}
              >
                <Text style={styles.modalSetText}>{t('marketplace.setAlert', 'Set Alert')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenLayout>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.xs,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  sortLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  sortChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
  },
  sortChipActive: {
    backgroundColor: COLORS.primarySurface,
  },
  sortChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  sortChipTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  listContent: {
    paddingBottom: SPACING.xxxl,
  },
  priceCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    ...SHADOWS.sm,
  },
  priceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  priceCardLeft: {
    flex: 1,
  },
  commodity: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  variety: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  priceCardRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  priceCardRight: {
    alignItems: 'flex-end',
  },
  bellBtn: {
    padding: SPACING.xs,
  },
  commodityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warning,
  },
  price: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  perUnit: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  priceCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  marketText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  changeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
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
  // Active Alerts Section
  alertsSection: {
    backgroundColor: COLORS.warning + '10',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  alertsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  alertsSectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.warning + '20',
  },
  alertInfo: {
    flex: 1,
  },
  alertCommodity: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  alertTarget: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  alertRemoveBtn: {
    padding: SPACING.xs,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  modalCommodity: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  modalCurrentPrice: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  modalInputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  rupeePrefix: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  modalInput: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.md,
    paddingLeft: SPACING.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
  },
  modalSetBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.warning,
    alignItems: 'center',
  },
  modalSetBtnDisabled: {
    opacity: 0.5,
  },
  modalSetText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
});

export default MandiPricesScreen;
