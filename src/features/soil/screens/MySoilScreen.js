import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import { fetchSoilData } from '../slice/soilSlice';
import ScreenLayout from '../../../components/common/ScreenLayout';

const StatBubble = ({ value, unit, label, color, onPress, icon }) => (
  <TouchableOpacity style={[styles.statBubble, { borderColor: color }]} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={16} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}{unit}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const MySoilScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const soil = useSelector((state) => state.soil);
  const crops = useSelector((state) => state.crops.crops);

  const [selectedCrop, setSelectedCrop] = React.useState(crops[0]?.name || 'Bell Pepper');

  useEffect(() => {
    dispatch(fetchSoilData());
  }, [dispatch]);

  const current = soil.current || { moisture: 45, temperature: 28, pH: 6.5, nitrogen: 45, phosphorus: 30, potassium: 25 };

  return (
    <ScreenLayout prefix="My," title="Soil" scrollable={true}>
      {/* Crop Selector */}
      <View style={styles.cropSelector}>
        <Text style={styles.cropName}>{selectedCrop}</Text>
        <TouchableOpacity style={styles.cropArrows}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.textSecondary} />
          <MaterialCommunityIcons name="plus" size={20} color={COLORS.primaryLight} />
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Soil Overview with Plant Image */}
      <View style={styles.soilOverview}>
        <View style={styles.plantContainer}>
          <MaterialCommunityIcons name="sprout" size={80} color={COLORS.primaryLight} />
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatBubble value={current.moisture} unit="%" label="Moisture" color={COLORS.chartMoisture} icon="water-percent" onPress={() => navigation.navigate('MoistureDetail')} />
            <StatBubble value={current.temperature} unit="°C" label="Temp" color={COLORS.chartTemperature} icon="thermometer" onPress={() => {}} />
          </View>
          <View style={styles.statsRow}>
            <StatBubble value={current.pH} unit="" label="pH" color={COLORS.chartPH} icon="test-tube" onPress={() => navigation.navigate('PhDetail')} />
            <StatBubble value={`${current.nitrogen}`} unit="%" label="Nitrogen" color={COLORS.chartNPK_N} icon="leaf" onPress={() => navigation.navigate('FertilizerDetail')} />
          </View>
          <View style={styles.statsRow}>
            <StatBubble value={`${current.phosphorus}`} unit="%" label="Phosphorus" color={COLORS.chartNPK_P} icon="flask" onPress={() => navigation.navigate('FertilizerDetail')} />
            <StatBubble value={`${current.potassium}`} unit="%" label="Potassium" color={COLORS.chartNPK_K} icon="atom" onPress={() => navigation.navigate('FertilizerDetail')} />
          </View>
        </View>
      </View>

      {/* Quick Details Cards */}
      <View style={styles.detailCards}>
        <TouchableOpacity style={styles.detailCard} onPress={() => navigation.navigate('MoistureDetail')}>
          <MaterialCommunityIcons name="water-percent" size={24} color={COLORS.chartMoisture} />
          <Text style={styles.detailCardTitle}>Moisture Details</Text>
          <Text style={styles.detailCardValue}>{current.moisture}%</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.detailCard} onPress={() => navigation.navigate('PhDetail')}>
          <MaterialCommunityIcons name="test-tube" size={24} color={COLORS.chartPH} />
          <Text style={styles.detailCardTitle}>pH Details</Text>
          <Text style={styles.detailCardValue}>{current.pH}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.detailCard} onPress={() => navigation.navigate('FertilizerDetail')}>
          <MaterialCommunityIcons name="flask" size={24} color={COLORS.chartNPK_N} />
          <Text style={styles.detailCardTitle}>Fertilizer Details</Text>
          <Text style={styles.detailCardValue}>NPK</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  cropSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xxl },
  cropName: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary },
  cropArrows: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  soilOverview: { alignItems: 'center', marginBottom: SPACING.xxxl },
  plantContainer: { width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xxl, borderWidth: 2, borderColor: COLORS.primaryLight + '40' },
  statsGrid: { width: '100%' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.md },
  statBubble: { width: 90, height: 80, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, padding: SPACING.sm },
  statValue: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, marginTop: 2 },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 1 },
  detailCards: { gap: SPACING.md },
  detailCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, gap: SPACING.md },
  detailCardTitle: { flex: 1, fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.textPrimary },
  detailCardValue: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primaryLight, marginRight: SPACING.sm },
});

export default MySoilScreen;
