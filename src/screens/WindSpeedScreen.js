import React from 'react';
import { View, Text, SafeAreaView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../style/WindSpeedScreenStyle';

const screenWidth = Dimensions.get('window').width;

const WindSpeedScreen = () => {
  const chartData = {
    labels: ['0', '12:00', '1:00', '2:00'],
    datasets: [
      {
        data: [0, 15, 11, 14, 10],
        color: (opacity = 1) => `rgba(56, 142, 60, ${opacity})`, // Green color
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '0',
      strokeWidth: '2',
    },
    withInnerLines: false,
    withOuterLines: true,
    withVerticalLabels: true,
    withHorizontalLabels: true,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>The,Weather</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wind Speed</Text>
          <Text style={styles.cardSubtitle}>Current Conditions</Text>
          <Text style={styles.windSpeedValue}>13 km/h</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 80}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            withShadow={false}
            fromZero={true}
          />
        </View>
        <View style={styles.card}>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                <Text style={styles.detailLabel}>Wind Direction</Text>
              </View>
              <Text style={styles.detailValue}>East</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons name="water-percent" size={24} color="#333" />
                <Text style={styles.detailLabel}>Humidity</Text>
              </View>
              <Text style={styles.detailValue}>19%</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons name="thermometer" size={24} color="#333" />
                <Text style={styles.detailLabel}>Temperature</Text>
              </View>
              <Text style={styles.detailValue}>40°C</Text>
            </View>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons name="weather-windy" size={24} color="#333" />
                <Text style={styles.detailLabel}>Wind Speed</Text>
              </View>
              <Text style={styles.detailValue}>13km/hr</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default WindSpeedScreen; 