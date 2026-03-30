import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { LineChart } from 'react-native-gifted-charts';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../../constants/layout';
import { fetchSoilData } from '../slice/soilSlice';
import ScreenLayout from '../../../components/common/ScreenLayout';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Mock health trend data (last 7 readings)
const MOCK_HEALTH_TREND = [
  { value: 62, label: 'Jan' },
  { value: 58, label: 'Feb' },
  { value: 65, label: 'Mar' },
  { value: 70, label: 'Apr' },
  { value: 68, label: 'May' },
  { value: 74, label: 'Jun' },
  { value: 72, label: 'Jul' },
];

const getScoreColor = (score) => {
  if (score >= 75) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.danger;
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const ScoreBar = ({ label, score, weight, color, icon }) => (
  <View style={styles.scoreBarContainer}>
    <View style={styles.scoreBarHeader}>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <Text style={styles.scoreBarLabel}>{label}</Text>
      <Text style={styles.scoreBarWeight}>{weight}%</Text>
      <Text style={[styles.scoreBarValue, { color }]}>{score}/100</Text>
    </View>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${score}%`, backgroundColor: color }]} />
    </View>
  </View>
);

const RecommendationCard = ({ icon, text, color }) => (
  <View style={styles.recCard}>
    <View style={[styles.recIconBg, { backgroundColor: color + '20' }]}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.recText}>{text}</Text>
  </View>
);

const SoilHealthScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const soil = useSelector((state) => state.soil);
  const current = soil.current;

  useEffect(() => {
    dispatch(fetchSoilData());
  }, [dispatch]);

  // Calculate individual scores
  const scores = useMemo(() => {
    if (!current) return { ph: 0, nutrient: 0, moisture: 0, carbon: 0, overall: 0 };

    // pH score: ideal range 6.0-7.5
    let phScore = 0;
    if (current.pH >= 6.0 && current.pH <= 7.5) {
      phScore = 100;
    } else if (current.pH >= 5.0 && current.pH <= 8.5) {
      const dist = current.pH < 6.0 ? 6.0 - current.pH : current.pH - 7.5;
      phScore = clamp(Math.round(100 - dist * 50), 0, 100);
    } else {
      phScore = clamp(Math.round(20 - Math.abs(current.pH - 6.75) * 5), 0, 100);
    }

    // Nutrient balance: check N, P, K levels (ideal: 20-60% each)
    const nutrientScore = (() => {
      const n = current.nitrogen || 0;
      const p = current.phosphorus || 0;
      const k = current.potassium || 0;
      const scoreN = n >= 20 && n <= 60 ? 100 : clamp(Math.round(100 - Math.abs(n - 40) * 2), 0, 100);
      const scoreP = p >= 15 && p <= 50 ? 100 : clamp(Math.round(100 - Math.abs(p - 32) * 2), 0, 100);
      const scoreK = k >= 15 && k <= 50 ? 100 : clamp(Math.round(100 - Math.abs(k - 32) * 2), 0, 100);
      return Math.round((scoreN + scoreP + scoreK) / 3);
    })();

    // Moisture score: ideal 40-70%
    const m = current.moisture || 0;
    const moistureScore = m >= 40 && m <= 70
      ? 100
      : clamp(Math.round(100 - Math.abs(m - 55) * 3), 0, 100);

    // Organic carbon: ideal 0.5-1.5%
    const oc = soil.organicCarbon || 0;
    const carbonScore = oc >= 0.5 && oc <= 1.5
      ? 100
      : clamp(Math.round(100 - Math.abs(oc - 1.0) * 80), 0, 100);

    // Overall weighted score
    const overall = Math.round(
      phScore * 0.2 +
      nutrientScore * 0.4 +
      moistureScore * 0.2 +
      carbonScore * 0.2
    );

    return {
      ph: phScore,
      nutrient: nutrientScore,
      moisture: moistureScore,
      carbon: carbonScore,
      overall,
    };
  }, [current, soil.organicCarbon]);

  // Generate recommendations
  const recommendations = useMemo(() => {
    if (!current) return [];
    const tips = [];
    const pH = current.pH || 7;
    if (pH < 6.0) tips.push({ icon: 'pill', text: 'Add lime to increase soil pH', color: COLORS.chartPH });
    if (pH > 7.5) tips.push({ icon: 'pill', text: 'Add sulfur to decrease soil pH', color: COLORS.chartPH });
    if ((current.nitrogen || 0) < 20) tips.push({ icon: 'leaf', text: 'Apply urea or ammonium sulfate for nitrogen', color: COLORS.chartNPK_N });
    if ((current.phosphorus || 0) < 15) tips.push({ icon: 'flask', text: 'Apply DAP or superphosphate for phosphorus', color: COLORS.chartNPK_P });
    if ((current.potassium || 0) < 15) tips.push({ icon: 'atom', text: 'Apply muriate of potash (MOP) for potassium', color: COLORS.chartNPK_K });
    if ((current.moisture || 0) < 40) tips.push({ icon: 'water', text: 'Increase irrigation frequency', color: COLORS.chartMoisture });
    if ((soil.organicCarbon || 0) < 0.5) tips.push({ icon: 'compost', text: 'Add compost or green manure for organic carbon', color: COLORS.primary });
    if (tips.length === 0) tips.push({ icon: 'check-circle', text: 'All parameters are within healthy ranges!', color: COLORS.success });
    return tips;
  }, [current, soil.organicCarbon]);

  const overallColor = getScoreColor(scores.overall);

  return (
    <ScreenLayout
      title="Soil Health"
      showBack
      onBack={() => navigation.goBack()}
      scrollable={true}
    >
      {/* Overall Score */}
      <View style={styles.overallContainer}>
        <AnimatedCircularProgress
          size={180}
          width={14}
          fill={scores.overall}
          tintColor={overallColor}
          backgroundColor={COLORS.border}
          rotation={0}
          lineCap="round"
        >
          {() => (
            <View style={styles.scoreCenter}>
              <Text style={[styles.overallScore, { color: overallColor }]}>{scores.overall}</Text>
              <Text style={styles.overallLabel}>Health Score</Text>
            </View>
          )}
        </AnimatedCircularProgress>
        <Text style={styles.overallDescription}>
          {scores.overall >= 75
            ? 'Your soil is in excellent health!'
            : scores.overall >= 50
              ? 'Your soil health is moderate. See recommendations below.'
              : 'Your soil needs attention. Follow the recommendations below.'}
        </Text>
      </View>

      {/* Score Breakdown */}
      <Text style={styles.sectionTitle}>Score Breakdown</Text>
      <View style={styles.breakdownCard}>
        <ScoreBar
          label="pH Score"
          score={scores.ph}
          weight={20}
          color={getScoreColor(scores.ph)}
          icon="test-tube"
        />
        <ScoreBar
          label="Nutrient Balance"
          score={scores.nutrient}
          weight={40}
          color={getScoreColor(scores.nutrient)}
          icon="leaf"
        />
        <ScoreBar
          label="Moisture Level"
          score={scores.moisture}
          weight={20}
          color={getScoreColor(scores.moisture)}
          icon="water-percent"
        />
        <ScoreBar
          label="Organic Carbon"
          score={scores.carbon}
          weight={20}
          color={getScoreColor(scores.carbon)}
          icon="molecule"
        />
      </View>

      {/* Recommendations */}
      <Text style={styles.sectionTitle}>Recommendations</Text>
      <View style={styles.recsContainer}>
        {recommendations.map((rec, index) => (
          <RecommendationCard key={index} {...rec} />
        ))}
      </View>

      {/* Health Trend */}
      <Text style={styles.sectionTitle}>Health Trend</Text>
      <View style={styles.chartCard}>
        <LineChart
          data={MOCK_HEALTH_TREND}
          width={SCREEN_WIDTH - SPACING.lg * 4 - SPACING.xl * 2}
          height={160}
          spacing={(SCREEN_WIDTH - SPACING.lg * 4 - SPACING.xl * 2) / (MOCK_HEALTH_TREND.length - 1)}
          color={COLORS.primaryLight}
          thickness={2}
          startFillColor={COLORS.primaryLight + '40'}
          endFillColor={COLORS.primaryLight + '05'}
          areaChart
          curved
          hideDataPoints={false}
          dataPointsColor={COLORS.primaryLight}
          dataPointsRadius={4}
          yAxisColor={COLORS.border}
          xAxisColor={COLORS.border}
          yAxisTextStyle={{ fontSize: FONT_SIZES.xs, color: COLORS.textTertiary }}
          xAxisLabelTextStyle={{ fontSize: FONT_SIZES.xs, color: COLORS.textTertiary }}
          noOfSections={4}
          maxValue={100}
          rulesColor={COLORS.divider}
          rulesType="dashed"
        />
      </View>

      <View style={{ height: SPACING.xxxl }} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  overallContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    marginBottom: SPACING.xl,
  },
  scoreCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overallScore: {
    fontSize: FONT_SIZES.hero,
    fontWeight: FONT_WEIGHTS.bold,
  },
  overallLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: -2,
  },
  overallDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  breakdownCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  scoreBarContainer: {
    gap: SPACING.sm,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scoreBarLabel: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
  },
  scoreBarWeight: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  scoreBarValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    minWidth: 48,
    textAlign: 'right',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  recsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  recIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  chartCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
});

export default SoilHealthScreen;
