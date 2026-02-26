import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../constants/typography';
import { SPACING } from '../../../constants/spacing';
import { BORDER_RADIUS } from '../../../constants/layout';
import { fetchHistoricalWeather } from '../slice/weatherSlice';

const TABS = ['Yesterday', 'Last Week', 'Monthly'];

const HistoricalWeatherScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Yesterday');
  const historical = useSelector((s) => s.weather.historical);

  useEffect(() => { dispatch(fetchHistoricalWeather()); }, [dispatch]);

  const weekData = historical?.week || [
    { day: 'Mon', temp: 38, humidity: 65 }, { day: 'Tue', temp: 36, humidity: 70 },
    { day: 'Wed', temp: 34, humidity: 72 }, { day: 'Thu', temp: 33, humidity: 78 },
    { day: 'Fri', temp: 35, humidity: 74 }, { day: 'Sat', temp: 37, humidity: 68 },
    { day: 'Sun', temp: 39, humidity: 65 },
  ];

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titlePrefix}>The</Text>
        <Text style={styles.titleText}> Weather</Text>
      </View>
      <Text style={styles.sectionTitle}>Historical Weather Data</Text>
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Temperature Trend</Text>
        <View style={styles.chartArea}>
          {weekData.map((d, i) => (
            <View key={i} style={styles.chartColumn}>
              <View style={[styles.chartBar, { height: `${(d.temp / 45) * 100}%` }]} />
              <Text style={styles.chartLabel}>{d.day || `D${i + 1}`}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Humidity Trend</Text>
        <View style={styles.chartArea}>
          {weekData.map((d, i) => (
            <View key={i} style={styles.chartColumn}>
              <View style={[styles.chartBarBlue, { height: `${d.humidity}%` }]} />
              <Text style={styles.chartLabel}>{d.day || `D${i + 1}`}</Text>
            </View>
          ))}
        </View>
      </View>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}><Text style={styles.statLabel}>Avg Temp</Text><Text style={styles.statValue}>36°C</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Avg Humidity</Text><Text style={styles.statValue}>70%</Text></View>
        <View style={styles.statCard}><Text style={styles.statLabel}>Total Rain</Text><Text style={styles.statValue}>12mm</Text></View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxxl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  titlePrefix: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  titleText: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  tabRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  tab: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.background },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium },
  tabTextActive: { color: COLORS.white },
  chartCard: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg },
  chartTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  chartArea: { height: 140, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  chartColumn: { alignItems: 'center', flex: 1 },
  chartBar: { width: 24, borderRadius: 4, backgroundColor: COLORS.warning + '80', marginBottom: 4 },
  chartBarBlue: { width: 24, borderRadius: 4, backgroundColor: COLORS.info + '80', marginBottom: 4 },
  chartLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  statsRow: { flexDirection: 'row', gap: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, alignItems: 'center' },
  statLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  statValue: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.textPrimary },
});

export default HistoricalWeatherScreen;
