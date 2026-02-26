import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const AppBarChart = ({
  data = [],
  height = 200,
}) => {
  const { width } = useWindowDimensions();
  const chartWidth = width - SPACING.lg * 2 - 40;

  const chartData = data.map((item) => ({
    value: item.value,
    label: item.label,
    frontColor: item.frontColor || COLORS.primary,
    topLabelComponent: undefined,
    labelTextStyle: {
      color: COLORS.textSecondary,
      fontSize: FONT_SIZES.xs,
    },
    barBorderTopLeftRadius: 6,
    barBorderTopRightRadius: 6,
  }));

  const barWidth = Math.max(
    20,
    Math.min(40, (chartWidth - chartData.length * 10) / chartData.length)
  );

  return (
    <View style={styles.container}>
      <BarChart
        data={chartData}
        height={height}
        width={chartWidth}
        barWidth={barWidth}
        spacing={10}
        noOfSections={4}
        yAxisTextStyle={{
          color: COLORS.textSecondary,
          fontSize: FONT_SIZES.xs,
        }}
        xAxisColor={COLORS.divider}
        yAxisColor={COLORS.divider}
        rulesColor={COLORS.divider}
        rulesType="dashed"
        initialSpacing={10}
        isAnimated
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
});

export default AppBarChart;
