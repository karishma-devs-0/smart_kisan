import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const AppPieChart = ({
  data = [],
  radius = 80,
  showText = false,
}) => {
  const chartData = data.map((item) => ({
    value: item.value,
    color: item.color || COLORS.primary,
    text: item.text || '',
    textColor: COLORS.white,
    textSize: FONT_SIZES.xs,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const renderCenterLabel = () => {
    if (!showText) return null;
    return (
      <View style={styles.centerLabel}>
        <Text style={styles.centerValue}>{total}</Text>
        <Text style={styles.centerText}>Total</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <PieChart
        data={chartData}
        radius={radius}
        innerRadius={showText ? radius * 0.6 : 0}
        centerLabelComponent={showText ? renderCenterLabel : undefined}
        showText={!showText}
        textColor={COLORS.white}
        textSize={FONT_SIZES.xs}
        focusOnPress
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  centerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});

export default AppPieChart;
