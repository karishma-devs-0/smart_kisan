import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { fetchAnalytics } from '../slice/analyticsSlice';

const NDVI_COLORS = {
  excellent: '#1B5E20',
  good: '#4CAF50',
  moderate: '#FF9800',
  poor: '#F44336',
};

const getNdviColor = (value) => {
  if (value > 0.7) return NDVI_COLORS.excellent;
  if (value > 0.5) return NDVI_COLORS.good;
  if (value > 0.3) return NDVI_COLORS.moderate;
  return NDVI_COLORS.poor;
};

const getHealthLabel = (health) => {
  return health.charAt(0).toUpperCase() + health.slice(1);
};

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ZoneCard = ({ zone }) => {
  const color = getNdviColor(zone.ndviValue);
  return (
    <View style={styles.zoneCard}>
      <View style={[styles.zoneIndicator, { backgroundColor: color }]} />
      <View style={styles.zoneContent}>
        <View style={styles.zoneHeaderRow}>
          <Text style={styles.zoneName} numberOfLines={1}>{zone.name}</Text>
          <View style={[styles.healthBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.healthBadgeText, { color }]}>{getHealthLabel(zone.health)}</Text>
          </View>
        </View>
        <View style={styles.zoneDetails}>
          <View style={styles.zoneDetailItem}>
            <Text style={styles.zoneDetailLabel}>NDVI</Text>
            <Text style={[styles.zoneDetailValue, { color }]}>{zone.ndviValue.toFixed(2)}</Text>
          </View>
          <View style={styles.zoneDetailItem}>
            <Text style={styles.zoneDetailLabel}>Area</Text>
            <Text style={styles.zoneDetailValue}>{zone.area} acres</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const ExpertCard = ({ expert }) => (
  <View style={styles.expertCard}>
    <View style={styles.expertAvatarContainer}>
      <Text style={styles.expertAvatarText}>{expert.avatar}</Text>
      <View style={[styles.availabilityDot, { backgroundColor: expert.available ? COLORS.success : COLORS.textTertiary }]} />
    </View>
    <Text style={styles.expertName} numberOfLines={1}>{expert.name}</Text>
    <Text style={styles.expertSpecialization} numberOfLines={1}>{expert.specialization}</Text>
    <View style={styles.expertRatingRow}>
      <MaterialCommunityIcons name="star" size={14} color="#FFB300" />
      <Text style={styles.expertRating}>{expert.rating}</Text>
    </View>
    <Text style={styles.expertConsultations}>{expert.consultations} consults</Text>
  </View>
);

const NDVIMapScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { ndviData, expertNetwork, loading } = useSelector((state) => state.analytics);

  useEffect(() => {
    if (!ndviData) {
      dispatch(fetchAnalytics());
    }
  }, [dispatch, ndviData]);

  const ndvi = ndviData || { overallIndex: 0.72, lastUpdated: new Date().toISOString(), zones: [] };
  const experts = expertNetwork || [];
  const overallColor = getNdviColor(ndvi.overallIndex);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titlePrefix}>NDVI</Text>
        <Text style={styles.titleText}> Map</Text>
      </View>

      {/* Overall NDVI Index */}
      <View style={styles.overallCard}>
        <View style={styles.overallHeader}>
          <MaterialCommunityIcons name="satellite-variant" size={24} color={overallColor} />
          <Text style={styles.overallLabel}>Overall NDVI Index</Text>
        </View>
        <View style={styles.overallValueRow}>
          <Text style={[styles.overallValue, { color: overallColor }]}>{ndvi.overallIndex.toFixed(2)}</Text>
          <View style={[styles.overallIndicator, { backgroundColor: overallColor + '20' }]}>
            <View style={[styles.overallIndicatorDot, { backgroundColor: overallColor }]} />
            <Text style={[styles.overallIndicatorText, { color: overallColor }]}>
              {ndvi.overallIndex > 0.6 ? 'Good Vegetation' : 'Needs Attention'}
            </Text>
          </View>
        </View>
        <Text style={styles.lastUpdated}>Last updated: {formatDate(ndvi.lastUpdated)}</Text>
      </View>

      {/* NDVI Scale Legend */}
      <Text style={styles.sectionTitle}>NDVI Scale</Text>
      <View style={styles.scaleCard}>
        <View style={styles.scaleBar}>
          <View style={[styles.scaleSegment, { backgroundColor: '#F44336', flex: 1 }]} />
          <View style={[styles.scaleSegment, { backgroundColor: '#FF9800', flex: 1 }]} />
          <View style={[styles.scaleSegment, { backgroundColor: '#4CAF50', flex: 1 }]} />
          <View style={[styles.scaleSegment, { backgroundColor: '#1B5E20', flex: 1 }]} />
        </View>
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabel}>0.0</Text>
          <Text style={styles.scaleLabel}>0.3</Text>
          <Text style={styles.scaleLabel}>0.5</Text>
          <Text style={styles.scaleLabel}>0.7</Text>
          <Text style={styles.scaleLabel}>1.0</Text>
        </View>
        <View style={styles.scaleLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: NDVI_COLORS.poor }]} />
            <Text style={styles.legendText}>Poor</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: NDVI_COLORS.moderate }]} />
            <Text style={styles.legendText}>Moderate</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: NDVI_COLORS.good }]} />
            <Text style={styles.legendText}>Good</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: NDVI_COLORS.excellent }]} />
            <Text style={styles.legendText}>Excellent</Text>
          </View>
        </View>
      </View>

      {/* Zone List */}
      <Text style={styles.sectionTitle}>Vegetation Zones</Text>
      {ndvi.zones.map((zone) => (
        <ZoneCard key={zone.id} zone={zone} />
      ))}

      {/* Expert Network */}
      <View style={styles.sectionHeaderRow}>
        <MaterialCommunityIcons name="account-group" size={22} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>Expert Network</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.expertScroll}>
        {experts.map((expert) => (
          <ExpertCard key={expert.id} expert={expert} />
        ))}
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  contentContainer: { padding: SPACING.lg, paddingBottom: SPACING.xxxxl },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  titlePrefix: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  titleText: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md, marginTop: SPACING.lg },

  // Overall NDVI Card
  overallCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  overallHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  overallLabel: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.textSecondary },
  overallValueRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.md },
  overallValue: { fontSize: FONT_SIZES.hero, fontWeight: FONT_WEIGHTS.bold },
  overallIndicator: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full },
  overallIndicatorDot: { width: 8, height: 8, borderRadius: 4 },
  overallIndicatorText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium },
  lastUpdated: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },

  // NDVI Scale
  scaleCard: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl },
  scaleBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: SPACING.sm },
  scaleSegment: { height: '100%' },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  scaleLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  scaleLegend: { flexDirection: 'row', justifyContent: 'space-around' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },

  // Zone Cards
  zoneCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  zoneIndicator: { width: 4 },
  zoneContent: { flex: 1, padding: SPACING.lg },
  zoneHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  zoneName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, flex: 1, marginRight: SPACING.sm },
  healthBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  healthBadgeText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.medium },
  zoneDetails: { flexDirection: 'row', gap: SPACING.xxl },
  zoneDetailItem: { gap: 2 },
  zoneDetailLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  zoneDetailValue: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },

  // Expert Cards
  expertScroll: { marginBottom: SPACING.xl },
  expertCard: {
    width: 150,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginRight: SPACING.md,
    alignItems: 'center',
  },
  expertAvatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  expertAvatarText: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  availabilityDot: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  expertName: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 2 },
  expertSpecialization: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.sm },
  expertRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
  expertRating: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.textPrimary },
  expertConsultations: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
});

export default NDVIMapScreen;
