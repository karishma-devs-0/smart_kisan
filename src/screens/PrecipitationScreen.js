import React from 'react';
import { View, Text, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart } from 'react-native-chart-kit';
import styles from '../style/PrecipitationScreenStyle';

const hourlyData = [
  { time: '12:00 pm', temp: '40°C', rain: '0%', icon: 'weather-cloudy' },
  { time: '1:00 pm', temp: '41°C', rain: '18%', icon: 'weather-cloudy' },
  { time: '2:00 pm', temp: '38°C', rain: '13%', icon: 'weather-cloudy' },
  { time: '3:00 pm', temp: '42°C', rain: '1%', icon: 'weather-cloudy' },
  { time: '4:00 pm', temp: '40°C', rain: '0%', icon: 'weather-partly-cloudy' },
  { time: '5:00 pm', temp: '38°C', rain: '0%', icon: 'weather-partly-cloudy' },
  { time: '6:00 pm', temp: '35°C', rain: '0%', icon: 'weather-sunny' },
  { time: '7:00 pm', temp: '30°C', rain: '0%', icon: 'weather-sunny' },
];

const weeklyData = [
  { day: 'Monday', rain: '0%', high: '40°C', low: '22°C', icon: 'weather-cloudy' },
  { day: 'Tuesday', rain: '0%', high: '42°C', low: '24°C', icon: 'weather-sunny' },
  { day: 'Wednesday', rain: '0%', high: '38°C', low: '26°C', icon: 'weather-sunny' },
  { day: 'Thursday', rain: '0%', high: '39°C', low: '28°C', icon: 'weather-cloudy' },
  { day: 'Friday', rain: '0%', high: '47°C', low: '24°C', icon: 'weather-pouring' },
  { day: 'Saturday', rain: '0%', high: '39°C', low: '25°C', icon: 'weather-pouring' },
  { day: 'Sunday', rain: '0%', high: '36°C', low: '26°C', icon: 'weather-night-partly-cloudy' },
];

const chartData = {
  labels: ['1', '5', '10', '15', '20', '25', '30'],
  datasets: [
    {
      data: [200, 450, 300, 500, 400, 480, 420],
      color: (opacity = 1) => `rgba(56, 142, 60, ${opacity})`,
      strokeWidth: 2,
    },
    {
      data: [150, 300, 200, 350, 300, 320, 310],
      color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
      strokeWidth: 2,
    },
  ],
  legend: ['Daily Average', 'Graphical Representation'],
};

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '3',
    strokeWidth: '2',
    stroke: '#388e3c',
  },
};

const screenWidth = Dimensions.get('window').width;

const PrecipitationScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>The precipitation</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Historical Weather Data</Text>
          <Text style={styles.sectionTitle}>Yesterday</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyRow}>
            {hourlyData.map((item, idx) => (
              <View key={idx} style={styles.hourlyItem}>
                <MaterialCommunityIcons name={item.icon} size={32} color="#888" />
                <Text style={styles.hourlyTemp}>{item.temp}</Text>
                <Text style={styles.hourlyRain}>{item.rain}</Text>
                <Text style={styles.hourlyTime}>{item.time}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Last Week</Text>
          <View style={styles.weeklyContainer}>
            {weeklyData.map((item, idx) => (
              <View key={idx} style={styles.weeklyRow}>
                <Text style={styles.weeklyDay}>{item.day}</Text>
                <MaterialCommunityIcons name="water-outline" size={18} color="#1B5E20" />
                <Text style={styles.weeklyRain}>{item.rain}</Text>
                <Text style={styles.weeklyTempHigh}>{item.high}</Text>
                <Text style={styles.weeklyTempLow}>{item.low}</Text>
                <MaterialCommunityIcons name={item.icon} size={22} color="#888" />
              </View>
            ))}
          </View>
        </View>
        <View style={styles.graphCard}>
          <Text style={styles.graphTitle}>Graphical Representation</Text>
          <View style={styles.graphLabelsRow}>
            <View style={styles.greenDot} />
            <Text style={styles.graphLabel}>Daily Average</Text>
            <View style={{ width: 24 }} />
            <View style={styles.blueDot} />
            <Text style={styles.graphLabel}>Graphical Representation</Text>
          </View>
          <LineChart
            data={{
              labels: ['1', '5', '10', '15', '20', '25', '30'],
              datasets: [
                {
                  data: [200, 450, 300, 500, 400, 480, 420],
                  color: (opacity = 1) => `rgba(56, 142, 60, ${opacity})`,
                  strokeWidth: 2,
                },
                {
                  data: [150, 300, 200, 350, 300, 320, 310],
                  color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 16 }}
            withShadow={false}
            fromZero={true}
            withLegend={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrecipitationScreen; 