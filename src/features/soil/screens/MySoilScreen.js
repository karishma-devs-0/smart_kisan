import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { fetchSoilData, setSelectedCrop, addSoilCrop, removeSoilCrop } from '../slice/soilSlice';
import { SOIL_CROPS, CROP_SOIL_RANGES } from '../mock/soilMockData';
import ScreenLayout from '../../../components/common/ScreenLayout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getHealthColor = (score) => {
  if (score > 70) return COLORS.success;
  if (score >= 40) return COLORS.warning;
  return COLORS.danger;
};

const getHealthEmoji = (score) => {
  if (score > 70) return 'emoticon-happy-outline';
  if (score >= 40) return 'emoticon-neutral-outline';
  return 'emoticon-sad-outline';
};

const getHealthLabel = (score) => {
  if (score > 70) return 'Healthy';
  if (score >= 40) return 'Needs Attention';
  return 'Unhealthy';
};

const getStatusColor = (value, range) => {
  if (!range) return COLORS.textSecondary;
  if (value < range[0]) return COLORS.danger;
  if (value > range[1]) return COLORS.warning;
  return COLORS.success;
};

const getStatusIcon = (value, range) => {
  if (!range) return 'minus';
  if (value < range[0]) return 'arrow-down-bold';
  if (value > range[1]) return 'arrow-up-bold';
  return 'check-bold';
};

const getStatusText = (value, range) => {
  if (!range) return '';
  if (value < range[0]) return 'Low';
  if (value > range[1]) return 'High';
  return 'OK';
};

// ─── Simple Metric Row ──────────────────────────────────────────────────────
// Traffic light style: green = OK, yellow = high, red = low

const MetricRow = ({ icon, label, value, unit, range, onPress, color }) => {
  const status = getStatusText(value, range);
  const statusColor = getStatusColor(value, range);
  const statusIcon = getStatusIcon(value, range);

  return (
    <TouchableOpacity style={s.metricRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.metricIconWrap, { backgroundColor: (color || COLORS.primaryLight) + '15' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color || COLORS.primaryLight} />
      </View>
      <View style={s.metricInfo}>
        <Text style={s.metricLabel}>{label}</Text>
        <Text style={s.metricValue}>
          {value}<Text style={s.metricUnit}>{unit}</Text>
        </Text>
      </View>
      {range && (
        <View style={[s.statusBadge, { backgroundColor: statusColor + '15' }]}>
          <MaterialCommunityIcons name={statusIcon} size={14} color={statusColor} />
          <Text style={[s.statusText, { color: statusColor }]}>{status}</Text>
        </View>
      )}
      <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );
};

// ─── Action Needed Card ──────────────────────────────────────────────────────
// Shows only the MOST IMPORTANT action the farmer should take

const getTopAction = (current, optimalRange) => {
  if (!current || !optimalRange) return null;

  const checks = [
    {
      param: 'moisture',
      value: current.moisture,
      range: optimalRange.moisture,
      lowAction: 'Water your field — soil is too dry',
      lowIcon: 'water',
      highAction: 'Stop watering — soil is too wet',
      highIcon: 'water-off',
    },
    {
      param: 'pH',
      value: current.pH,
      range: optimalRange.pH,
      lowAction: 'Add lime to fix acidic soil',
      lowIcon: 'flask-round-bottom',
      highAction: 'Add sulfur — soil is too alkaline',
      highIcon: 'flask-round-bottom',
    },
    {
      param: 'nitrogen',
      value: current.nitrogen,
      range: optimalRange.nitrogen,
      lowAction: 'Apply urea or compost — low nitrogen',
      lowIcon: 'leaf',
      highAction: 'Reduce fertilizer — excess nitrogen',
      highIcon: 'leaf',
    },
    {
      param: 'phosphorus',
      value: current.phosphorus,
      range: optimalRange.phosphorus,
      lowAction: 'Apply DAP fertilizer — low phosphorus',
      lowIcon: 'flask',
      highAction: 'Stop phosphorus fertilizer',
      highIcon: 'flask',
    },
    {
      param: 'potassium',
      value: current.potassium,
      range: optimalRange.potassium,
      lowAction: 'Apply potash (MOP) — low potassium',
      lowIcon: 'atom',
      highAction: 'Reduce potash application',
      highIcon: 'atom',
    },
  ];

  for (const check of checks) {
    if (check.value < check.range[0]) {
      return { text: check.lowAction, icon: check.lowIcon, color: COLORS.danger, type: 'urgent' };
    }
  }
  for (const check of checks) {
    if (check.value > check.range[1]) {
      return { text: check.highAction, icon: check.highIcon, color: COLORS.warning, type: 'warning' };
    }
  }
  return { text: 'All good! Your soil is healthy', icon: 'check-circle', color: COLORS.success, type: 'good' };
};

// ─── Crop Chip ───────────────────────────────────────────────────────────────

const CropChip = ({ crop, selected, onPress }) => (
  <TouchableOpacity style={s.cropChip} onPress={onPress} activeOpacity={0.7}>
    <View
      style={[
        s.cropIconCircle,
        { backgroundColor: crop.color + '20' },
        selected && { borderColor: COLORS.primaryLight, borderWidth: 2.5, backgroundColor: COLORS.primaryLight + '12' },
      ]}
    >
      <MaterialCommunityIcons name={crop.icon} size={24} color={selected ? COLORS.primaryLight : crop.color} />
    </View>
    <Text style={[s.cropChipLabel, selected && s.cropChipLabelActive]} numberOfLines={1}>
      {crop.name}
    </Text>
  </TouchableOpacity>
);

// ─── Add Crop Modal ──────────────────────────────────────────────────────────

const AddCropModal = ({ visible, onClose, userCrops, onToggleCrop }) => {
  const userCropIds = useMemo(() => new Set(userCrops.map((c) => c.id)), [userCrops]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Your Crops</Text>
            <TouchableOpacity onPress={onClose} style={s.modalClose}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={s.modalSubtitle}>We'll show soil health based on your crop</Text>
          <FlatList
            data={SOIL_CROPS}
            numColumns={3}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.modalGrid}
            renderItem={({ item }) => {
              const added = userCropIds.has(item.id);
              return (
                <TouchableOpacity
                  style={s.modalCropItem}
                  onPress={() => onToggleCrop(item)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      s.modalCropIcon,
                      { backgroundColor: item.color + '20' },
                      added && { borderColor: COLORS.primaryLight, borderWidth: 2.5 },
                    ]}
                  >
                    <MaterialCommunityIcons name={item.icon} size={30} color={item.color} />
                    {added && (
                      <View style={s.checkOverlay}>
                        <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.primaryLight} />
                      </View>
                    )}
                  </View>
                  <Text style={[s.modalCropName, added && { color: COLORS.primaryLight, fontWeight: FONT_WEIGHTS.semiBold }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity style={s.modalDoneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={s.modalDoneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const MySoilScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const soil = useSelector((state) => state.soil);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  useEffect(() => {
    dispatch(fetchSoilData());
  }, [dispatch]);

  const { current, soilCrops = [], selectedCropId, soilReadings = [], loading } = soil;

  const hasData = current && (
    current.moisture > 0 || current.pH > 0 || current.nitrogen > 0 ||
    current.phosphorus > 0 || current.potassium > 0
  );
  const healthScore = hasData ? (current?.healthScore ?? 0) : 0;
  const isEmpty = (!current || !hasData) && !loading;

  const selectedCrop = useMemo(() => {
    if (selectedCropId) return soilCrops.find((c) => c.id === selectedCropId) || soilCrops[0];
    return soilCrops[0];
  }, [selectedCropId, soilCrops]);

  const cropName = selectedCrop?.name;
  const optimalRange = cropName ? CROP_SOIL_RANGES[cropName] : null;
  const topAction = getTopAction(current, optimalRange);

  const handleSelectCrop = (crop) => dispatch(setSelectedCrop(crop.id));

  const handleToggleCrop = (crop) => {
    const exists = soilCrops.find((c) => c.id === crop.id);
    if (exists) {
      dispatch(removeSoilCrop(crop.id));
      if (selectedCropId === crop.id && soilCrops.length > 1) {
        const remaining = soilCrops.filter((c) => c.id !== crop.id);
        dispatch(setSelectedCrop(remaining[0]?.id || null));
      }
    } else {
      dispatch(addSoilCrop(crop));
    }
  };

  const healthColor = getHealthColor(healthScore);

  return (
    <ScreenLayout prefix={t('soil.myPrefix')} title={t('soil.title')} scrollable>
      {isEmpty && (
        <View style={s.emptyState}>
          <MaterialCommunityIcons name="shovel" size={72} color={COLORS.textTertiary} />
          <Text style={s.emptyTitle}>No Soil Data Yet</Text>
          <Text style={s.emptySubtitle}>Add your first soil reading to get started</Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => navigation.navigate('AddSoilReading')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
            <Text style={s.emptyBtnText}>Add Soil Reading</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isEmpty && current && (
        <>
          {/* ── 1. CROP SELECTOR ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.cropScroll}
            style={s.cropScrollWrap}
          >
            {soilCrops.map((crop) => (
              <CropChip
                key={crop.id}
                crop={crop}
                selected={selectedCrop?.id === crop.id}
                onPress={() => handleSelectCrop(crop)}
              />
            ))}
            <TouchableOpacity style={s.addCropBtn} onPress={() => setCropModalVisible(true)} activeOpacity={0.7}>
              <View style={s.addCropCircle}>
                <MaterialCommunityIcons name="plus" size={22} color={COLORS.primaryLight} />
              </View>
              <Text style={s.addCropLabel}>Add</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ── 2. HEALTH SCORE — big, simple, tappable ── */}
          <TouchableOpacity
            style={[s.healthCard, SHADOWS.md]}
            onPress={() => navigation.navigate('SoilHealth')}
            activeOpacity={0.8}
          >
            <View style={s.healthRow}>
              <AnimatedCircularProgress
                size={100}
                width={8}
                fill={healthScore}
                tintColor={healthColor}
                backgroundColor={COLORS.border}
                rotation={0}
                lineCap="round"
              >
                {() => (
                  <View style={s.healthInner}>
                    <Text style={[s.healthNum, { color: healthColor }]}>{healthScore}</Text>
                    <Text style={s.healthOf}>/100</Text>
                  </View>
                )}
              </AnimatedCircularProgress>
              <View style={s.healthInfo}>
                <View style={s.healthLabelRow}>
                  <MaterialCommunityIcons name={getHealthEmoji(healthScore)} size={22} color={healthColor} />
                  <Text style={[s.healthLabel, { color: healthColor }]}>{getHealthLabel(healthScore)}</Text>
                </View>
                <Text style={s.healthCrop}>
                  {cropName ? `For ${cropName} crop` : 'Select a crop above'}
                </Text>
                <Text style={s.healthTap}>Tap for details →</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* ── 3. ACTION NEEDED — single most important action ── */}
          {topAction && (
            <View style={[s.actionCard, { borderLeftColor: topAction.color }, SHADOWS.sm]}>
              <View style={[s.actionIconWrap, { backgroundColor: topAction.color + '15' }]}>
                <MaterialCommunityIcons name={topAction.icon} size={24} color={topAction.color} />
              </View>
              <View style={s.actionInfo}>
                <Text style={s.actionLabel}>
                  {topAction.type === 'good' ? 'Status' : 'Action Needed'}
                </Text>
                <Text style={[s.actionText, { color: topAction.type === 'good' ? COLORS.success : COLORS.textPrimary }]}>
                  {topAction.text}
                </Text>
              </View>
            </View>
          )}

          {/* ── 4. KEY METRICS — simple list with traffic lights ── */}
          <Text style={s.sectionTitle}>Soil Readings</Text>
          <View style={[s.metricsCard, SHADOWS.sm]}>
            <MetricRow
              icon="water-percent"
              label="Moisture"
              value={current.moisture}
              unit="%"
              range={optimalRange?.moisture}
              color={COLORS.chartMoisture}
              onPress={() => navigation.navigate('MoistureDetail')}
            />
            <View style={s.divider} />
            <MetricRow
              icon="test-tube"
              label="pH Level"
              value={current.pH}
              unit=""
              range={optimalRange?.pH}
              color={COLORS.chartPH}
              onPress={() => navigation.navigate('PhDetail')}
            />
            <View style={s.divider} />
            <MetricRow
              icon="thermometer"
              label="Temperature"
              value={current.temperature}
              unit="°C"
              range={optimalRange?.temp}
              color={COLORS.chartTemperature}
              onPress={() => navigation.navigate('WeatherToday')}
            />
            <View style={s.divider} />
            <MetricRow
              icon="leaf"
              label="Nitrogen (N)"
              value={current.nitrogen}
              unit="%"
              range={optimalRange?.nitrogen}
              color={COLORS.chartNPK_N}
              onPress={() => navigation.navigate('FertilizerDetail')}
            />

            {/* Show more metrics on tap */}
            {showAllMetrics && (
              <>
                <View style={s.divider} />
                <MetricRow
                  icon="flask"
                  label="Phosphorus (P)"
                  value={current.phosphorus}
                  unit="%"
                  range={optimalRange?.phosphorus}
                  color={COLORS.chartNPK_P}
                  onPress={() => navigation.navigate('FertilizerDetail')}
                />
                <View style={s.divider} />
                <MetricRow
                  icon="atom"
                  label="Potassium (K)"
                  value={current.potassium}
                  unit="%"
                  range={optimalRange?.potassium}
                  color={COLORS.chartNPK_K}
                  onPress={() => navigation.navigate('FertilizerDetail')}
                />
                <View style={s.divider} />
                <MetricRow
                  icon="chart-arc"
                  label="Organic Carbon"
                  value={current.organicCarbon ?? 0}
                  unit="%"
                  color={COLORS.primaryLight}
                  onPress={() => navigation.navigate('SoilHealth')}
                />
                <View style={s.divider} />
                <MetricRow
                  icon="flash"
                  label="EC (Conductivity)"
                  value={current.ec ?? 0}
                  unit=" dS/m"
                  color={COLORS.warning}
                  onPress={() => navigation.navigate('SoilHealth')}
                />
                <View style={s.divider} />
                <View style={s.textureRow}>
                  <View style={[s.metricIconWrap, { backgroundColor: COLORS.info + '15' }]}>
                    <MaterialCommunityIcons name="terrain" size={22} color={COLORS.info} />
                  </View>
                  <View style={s.metricInfo}>
                    <Text style={s.metricLabel}>Soil Texture</Text>
                    <Text style={s.metricValue}>{current.texture || 'Not tested'}</Text>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={s.showMoreBtn}
              onPress={() => setShowAllMetrics(!showAllMetrics)}
              activeOpacity={0.7}
            >
              <Text style={s.showMoreText}>
                {showAllMetrics ? 'Show Less' : 'Show All Readings'}
              </Text>
              <MaterialCommunityIcons
                name={showAllMetrics ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={COLORS.primaryLight}
              />
            </TouchableOpacity>
          </View>

          {/* ── 5. QUICK ACTIONS — 2 big buttons ── */}
          <View style={s.actionsRow}>
            <TouchableOpacity
              style={[s.bigAction, { backgroundColor: COLORS.primaryLight }]}
              onPress={() => navigation.navigate('AddSoilReading')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus-circle" size={28} color={COLORS.white} />
              <Text style={s.bigActionTitle}>Add Reading</Text>
              <Text style={s.bigActionSub}>Manual or sensor</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.bigAction, { backgroundColor: COLORS.info }]}
              onPress={() => navigation.navigate('SoilHealth')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="clipboard-pulse" size={28} color={COLORS.white} />
              <Text style={s.bigActionTitle}>Full Report</Text>
              <Text style={s.bigActionSub}>Health & tips</Text>
            </TouchableOpacity>
          </View>

          {/* ── 6. RECENT ACTIVITY — only if readings exist ── */}
          {soilReadings.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Recent Activity</Text>
              <View style={[s.recentCard, SHADOWS.sm]}>
                {soilReadings.slice(0, 3).map((reading, idx) => (
                  <React.Fragment key={reading.id}>
                    <View style={s.recentRow}>
                      <MaterialCommunityIcons
                        name={reading.source === 'sensor' ? 'access-point' : reading.source === 'lab' ? 'microscope' : 'pencil'}
                        size={18}
                        color={COLORS.textSecondary}
                      />
                      <View style={s.recentInfo}>
                        <Text style={s.recentDate}>{reading.date}</Text>
                        <Text style={s.recentField}>{reading.field}</Text>
                      </View>
                      <Text style={s.recentSource}>{reading.source}</Text>
                    </View>
                    {idx < Math.min(soilReadings.length, 3) - 1 && <View style={s.divider} />}
                  </React.Fragment>
                ))}
              </View>
            </>
          )}
        </>
      )}

      <AddCropModal
        visible={cropModalVisible}
        onClose={() => setCropModalVisible(false)}
        userCrops={soilCrops}
        onToggleCrop={handleToggleCrop}
      />
    </ScreenLayout>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Empty state
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxxl * 2 },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginTop: SPACING.lg },
  emptySubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, paddingHorizontal: SPACING.xxl },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md, marginTop: SPACING.xl },
  emptyBtnText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.white },

  // Crop selector
  cropScrollWrap: { marginBottom: SPACING.lg },
  cropScroll: { paddingVertical: SPACING.xs, gap: SPACING.md },
  cropChip: { alignItems: 'center', width: 68 },
  cropIconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  cropChipLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  cropChipLabelActive: { color: COLORS.primaryLight, fontWeight: FONT_WEIGHTS.semiBold },
  addCropBtn: { alignItems: 'center', width: 68 },
  addCropCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: COLORS.primaryLight, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryLight + '08' },
  addCropLabel: { fontSize: FONT_SIZES.xs, color: COLORS.primaryLight, marginTop: 4, fontWeight: FONT_WEIGHTS.medium },

  // Health card
  healthCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg },
  healthRow: { flexDirection: 'row', alignItems: 'center' },
  healthInner: { alignItems: 'center', flexDirection: 'row' },
  healthNum: { fontSize: 28, fontWeight: FONT_WEIGHTS.bold },
  healthOf: { fontSize: FONT_SIZES.sm, color: COLORS.textTertiary, marginTop: 6 },
  healthInfo: { flex: 1, marginLeft: SPACING.xl },
  healthLabelRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  healthLabel: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold },
  healthCrop: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  healthTap: { fontSize: FONT_SIZES.xs, color: COLORS.primaryLight, marginTop: 6 },

  // Action card
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.lg, borderLeftWidth: 4 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  actionInfo: { flex: 1 },
  actionLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, fontWeight: FONT_WEIGHTS.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, marginTop: 2 },

  // Section
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.sm, marginTop: SPACING.xs },

  // Metrics card
  metricsCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, marginBottom: SPACING.lg, overflow: 'hidden' },
  metricRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.xs },
  metricIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  metricInfo: { flex: 1 },
  metricLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  metricValue: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary, marginTop: 1 },
  metricUnit: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.regular, color: COLORS.textSecondary },
  textureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.xs },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, marginRight: SPACING.sm },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.semiBold },
  divider: { height: 1, backgroundColor: COLORS.border + '60', marginHorizontal: SPACING.xs },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border + '40' },
  showMoreText: { fontSize: FONT_SIZES.sm, color: COLORS.primaryLight, fontWeight: FONT_WEIGHTS.medium },

  // Quick actions
  actionsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  bigAction: { flex: 1, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'center', gap: SPACING.xs },
  bigActionTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
  bigActionSub: { fontSize: FONT_SIZES.xs, color: COLORS.white + 'CC' },

  // Recent
  recentCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, marginBottom: SPACING.xxxl },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md },
  recentInfo: { flex: 1 },
  recentDate: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.textPrimary },
  recentField: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 1 },
  recentSource: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textTransform: 'capitalize', backgroundColor: COLORS.background, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: SPACING.lg, paddingBottom: SPACING.xl, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.xs },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  modalSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  modalGrid: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  modalCropItem: { width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md * 2) / 3, alignItems: 'center', marginBottom: SPACING.xl },
  modalCropIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  checkOverlay: { position: 'absolute', bottom: -2, right: -2, backgroundColor: COLORS.white, borderRadius: 10 },
  modalCropName: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, marginTop: 6, textAlign: 'center', fontWeight: FONT_WEIGHTS.medium },
  modalDoneBtn: { backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.md, marginHorizontal: SPACING.lg, alignItems: 'center' },
  modalDoneBtnText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white },
});

export default MySoilScreen;
