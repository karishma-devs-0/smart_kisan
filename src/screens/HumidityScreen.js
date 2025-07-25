import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../style/HumidityScreenStyle';
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(56, 142, 60, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#1B5E20',
  },
};

const HumidityScreen = () => {
  const navigation = useNavigation();

  const data = {
    labels: ['10', '4', '8', '2', '6'],
    datasets: [
      {
        data: [5, 2.5, 3, 2.8, 4.5],
        color: (opacity = 1) => `rgba(56, 142, 60, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>The,Weather</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.mainCard}>
          <Text style={styles.cardTitle}>Humidity</Text>
          <Text style={styles.cardSubtitle}>Current Conditions</Text>
          <Text style={styles.currentValue}>39 °C</Text>
          <LineChart
            data={data}
            width={screenWidth - 70}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
          />
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <MaterialCommunityIcons name="arrow-left-thin" size={24} color="#333" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Wind Direction</Text>
            </View>
            <Text style={styles.detailValue}>East</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons name="water-outline" size={24} color="#333" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Humidity</Text>
            </View>
            <Text style={styles.detailValue}>19%</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons name="thermometer" size={24} color="#333" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Temperature</Text>
            </View>
            <Text style={styles.detailValue}>40°C</Text>
          </View>
          <View style={[styles.detailRow, styles.lastDetailRow]}>
            <View style={styles.detailLabelContainer}>
                <MaterialCommunityIcons name="weather-windy" size={24} color="#333" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Wind Speed</Text>
            </View>
            <Text style={styles.detailValue}>13km/hr</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HumidityScreen; 