import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const AppLineChart = ({
  data = [],
  color = COLORS.primary,
  height = 200,
  showArea = true,
  yAxisSuffix = '',
  curved = true,
}) => {
  const { width } = useWindowDimensions();
  const chartWidth = width - SPACING.lg * 2 - 40;

  const chartData = data.map((item) => ({
    value: item.value,
    label: item.label,
    labelTextStyle: {
      color: COLORS.textSecondary,
      fontSize: FONT_SIZES.xs,
    },
  }));

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        height={height}
        width={chartWidth}
        color={color}
        thickness={2}
        curved={curved}
        areaChart={showArea}
        startFillColor={color}
        startOpacity={0.3}
        endFillColor={color}
        endOpacity={0.05}
        hideDataPoints={false}
        dataPointsColor={color}
        dataPointsRadius={4}
        yAxisTextStyle={{
          color: COLORS.textSecondary,
          fontSize: FONT_SIZES.xs,
        }}
        yAxisSuffix={yAxisSuffix}
        xAxisColor={COLORS.divider}
        yAxisColor={COLORS.divider}
        rulesColor={COLORS.divider}
        rulesType="dashed"
        noOfSections={4}
        spacing={chartData.length > 1 ? chartWidth / (chartData.length - 1) : chartWidth}
        initialSpacing={0}
        adjustToWidth
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
});

export default AppLineChart;
