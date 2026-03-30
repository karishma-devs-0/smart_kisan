import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { initChat } from '../slice/marketplaceSlice';

// ─── Star Rating ────────────────────────────────────────────────────────────

const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const name = i <= Math.floor(rating)
      ? 'star'
      : i <= rating + 0.5
        ? 'star-half-full'
        : 'star-outline';
    stars.push(
      <MaterialCommunityIcons key={i} name={name} size={16} color={COLORS.warning} />,
    );
  }
  return <View style={styles.starRow}>{stars}</View>;
};

// ─── Main Screen ────────────────────────────────────────────────────────────

const ListingDetailScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { listing } = route.params || {};
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');

  const typeIcons = { crop: 'sprout', input: 'flask', equipment: 'tractor' };
  const typeColors = { crop: COLORS.success, input: COLORS.info, equipment: COLORS.warning };
  const typeLabels = { crop: 'Crop', input: 'Farm Input', equipment: 'Equipment' };

  const handleContact = () => {
    Alert.alert(
      t('marketplace.contactSeller', 'Contact Seller'),
      t('marketplace.contactMessage', 'Call or message the seller to discuss this listing.'),
      [{ text: t('marketplace.ok', 'OK') }],
    );
  };

  const handleChat = () => {
    const sellerId = listing.seller.name.replace(/\s+/g, '-').toLowerCase();
    const chatId = `${listing.id}_currentUser`;
    const chatListing = { id: listing.id, title: listing.title, type: listing.type };
    const otherUser = { id: sellerId, name: listing.seller.name, location: listing.seller.location };
    dispatch(initChat({ chatId, listing: chatListing, otherUser }));
    navigation.navigate('Chat', { chatId, listing: chatListing, otherUser });
  };

  const handleOffer = () => {
    setOfferPrice('');
    setOfferModalVisible(true);
  };

  const submitOffer = () => {
    const price = parseFloat(offerPrice);
    if (!offerPrice || isNaN(price) || price <= 0) {
      Alert.alert(
        t('marketplace.invalidOffer', 'Invalid Offer'),
        t('marketplace.enterValidPrice', 'Please enter a valid price.'),
      );
      return;
    }
    setOfferModalVisible(false);
    Alert.alert(
      t('marketplace.offerSent', 'Offer Sent!'),
      t('marketplace.offerConfirmation', `Your offer of \u20B9${price.toLocaleString('en-IN')} for "${listing.title}" has been sent to ${listing.seller.name}. You will be notified when they respond.`),
      [{ text: t('marketplace.ok', 'OK') }],
    );
  };

  return (
    <ScreenLayout
      title={t('marketplace.listingDetail', 'Listing Detail')}
      showBack
      onBack={() => navigation.goBack()}
    >
      {/* Image Placeholder */}
      <View style={[styles.imagePlaceholder, { backgroundColor: (typeColors[listing.type] || COLORS.primary) + '10' }]}>
        <MaterialCommunityIcons
          name={typeIcons[listing.type] || 'package-variant'}
          size={64}
          color={typeColors[listing.type] || COLORS.primary}
        />
        <Text style={styles.imagePlaceholderText}>
          {t('marketplace.noImage', 'No image available')}
        </Text>
      </View>

      {/* Type Badge */}
      <View style={[styles.typeBadge, { backgroundColor: (typeColors[listing.type] || COLORS.primary) + '15' }]}>
        <MaterialCommunityIcons
          name={typeIcons[listing.type] || 'package-variant'}
          size={14}
          color={typeColors[listing.type] || COLORS.primary}
        />
        <Text style={[styles.typeBadgeText, { color: typeColors[listing.type] || COLORS.primary }]}>
          {typeLabels[listing.type] || 'Other'}
        </Text>
      </View>

      {/* Title & Price */}
      <Text style={styles.title}>{listing.title}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{'\u20B9'}{listing.price.toLocaleString('en-IN')}</Text>
        <Text style={styles.unit}>/{listing.unit}</Text>
      </View>

      {/* Quantity */}
      <View style={styles.detailRow}>
        <MaterialCommunityIcons name="package-variant" size={18} color={COLORS.textSecondary} />
        <Text style={styles.detailLabel}>{t('marketplace.quantity', 'Quantity')}:</Text>
        <Text style={styles.detailValue}>{listing.quantity} {listing.unit}</Text>
      </View>

      {/* Posted Date */}
      <View style={styles.detailRow}>
        <MaterialCommunityIcons name="calendar" size={18} color={COLORS.textSecondary} />
        <Text style={styles.detailLabel}>{t('marketplace.posted', 'Posted')}:</Text>
        <Text style={styles.detailValue}>{listing.postedDate}</Text>
      </View>

      {/* Description */}
      <View style={styles.descriptionSection}>
        <Text style={styles.sectionTitle}>{t('marketplace.description', 'Description')}</Text>
        <Text style={styles.description}>{listing.description}</Text>
      </View>

      {/* Seller Info Card */}
      <View style={styles.sellerCard}>
        <Text style={styles.sectionTitle}>{t('marketplace.sellerInfo', 'Seller Information')}</Text>
        <View style={styles.sellerRow}>
          <View style={styles.sellerAvatar}>
            <MaterialCommunityIcons name="account" size={28} color={COLORS.white} />
          </View>
          <View style={styles.sellerDetails}>
            <Text style={styles.sellerName}>{listing.seller.name}</Text>
            <View style={styles.sellerLocationRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.textTertiary} />
              <Text style={styles.sellerLocation}>{listing.seller.location}</Text>
            </View>
            <View style={styles.ratingRow}>
              <StarRating rating={listing.seller.rating} />
              <Text style={styles.ratingText}>{listing.seller.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Chat with Seller */}
      <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
        <MaterialCommunityIcons name="message-text" size={20} color={COLORS.white} />
        <Text style={styles.chatButtonText}>
          {t('marketplace.chatWithSeller', 'Chat with Seller')}
        </Text>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
          <MaterialCommunityIcons name="phone" size={20} color={COLORS.primary} />
          <Text style={styles.contactButtonText}>
            {t('marketplace.contactSeller', 'Contact Seller')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.offerButton} onPress={handleOffer}>
          <MaterialCommunityIcons name="handshake" size={20} color={COLORS.white} />
          <Text style={styles.offerButtonText}>
            {t('marketplace.makeOffer', 'Make Offer')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Make Offer Modal */}
      <Modal
        visible={offerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t('marketplace.makeOffer', 'Make Offer')}
            </Text>
            <Text style={styles.modalSubtitle}>
              {t('marketplace.listedPrice', 'Listed price')}: {'\u20B9'}{listing.price.toLocaleString('en-IN')}/{listing.unit}
            </Text>
            <View style={styles.offerInputRow}>
              <Text style={styles.currencySymbol}>{'\u20B9'}</Text>
              <TextInput
                style={styles.offerInput}
                placeholder={t('marketplace.enterOfferPrice', 'Enter your offer price')}
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
                value={offerPrice}
                onChangeText={setOfferPrice}
                autoFocus
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setOfferModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>
                  {t('marketplace.cancel', 'Cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitButton} onPress={submitOffer}>
                <Text style={styles.modalSubmitText}>
                  {t('marketplace.submitOffer', 'Submit Offer')}
                </Text>
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
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  imagePlaceholderText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  typeBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.lg,
  },
  price: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  unit: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  detailLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  descriptionSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  sellerCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
  },
  sellerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sellerLocation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  chatButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xxxl,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  contactButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.primary,
  },
  offerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    gap: SPACING.sm,
  },
  offerButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  offerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  currencySymbol: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  offerInput: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textSecondary,
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
});

export default ListingDetailScreen;
