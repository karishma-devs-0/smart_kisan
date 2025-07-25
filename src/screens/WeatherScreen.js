import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../style/WeatherScreenStyle';
import AppBar from '../components/AppBar';

const WeatherScreen = ({ appBarSettings }) => {
  // Placeholder data for forecast
  const hourlyForecast = [
    { time: '12:00 pm', temp: '40°C', condition: 'cloudy', rain: '0%' },
    { time: '1:00 pm', temp: '41°C', condition: 'cloudy', rain: '0%' },
    { time: '2:00 pm', temp: '39°C', condition: 'cloudy', rain: '0%' },
    { time: '3:00 pm', temp: '42°C', condition: 'cloudy', rain: '0%' },
    { time: '4:00 pm', temp: '40°C', condition: 'partlycloudy', rain: '0%' },
    { time: '5:00 pm', temp: '38°C', condition: 'partlycloudy', rain: '0%' },
    { time: '6:00 pm', temp: '35°C', condition: 'sunny', rain: '0%' },
    { time: '7:00 pm', temp: '30°C', condition: 'sunny', rain: '0%' },
    { time: '8:00 pm', temp: '28°C', condition: 'clear-night', rain: '0%' },
    { time: '9:00 pm', temp: '26°C', condition: 'clear-night', rain: '0%' },
    { time: '10:00 pm', temp: '24°C', condition: 'clear-night', rain: '0%' },
    { time: '11:00 pm', temp: '23°C', condition: 'clear-night', rain: '0%' },
    // Add more hourly data as needed
  ];

  const dailyForecast = [
    { day: 'Today', high: '40°C', low: '22°C', condition: 'cloudy', rain: '0%' },
    { day: 'Tue', high: '42°C', low: '24°C', condition: 'sunny', rain: '0%' },
    { day: 'Wed', high: '38°C', low: '26°C', condition: 'sunny', rain: '0%' },
    { day: 'Thu', high: '39°C', low: '28°C', condition: 'sunny', rain: '0%' },
    { day: 'Fri', high: '47°C', low: '24°C', condition: 'partlycloudy', rain: '0%' },
    { day: 'Sat', high: '39°C', low: '25°C', condition: 'rainy', rain: '0%' },
    { day: 'Sun', high: '36°C', low: '26°C', condition: 'thunderstorm', rain: '0%' },
    // Add more daily data as needed
  ];

  // Function to map condition to icon name (MaterialCommunityIcons)
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'cloudy':
        return 'weather-cloudy';
      case 'sunny':
        return 'weather-sunny';
      case 'partlycloudy':
        return 'weather-partly-cloudy';
      case 'rainy':
        return 'weather-pouring';
      case 'thunderstorm':
        return 'weather-lightning-rainy';
      default:
        return 'weather-partly-cloudy'; // Default icon
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppBar pageName="Weather page" title="My," subtitle="Weather" onSettingsPress={appBarSettings} />
      
      <ScrollView 
        style={styles.scrollViewContent}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Weather Card */}
        <View style={styles.todayCard}>
          <Text style={styles.sectionTitle}>Today</Text>
          <Text style={styles.currentConditions}>Current Conditions</Text>
          <View style={styles.currentWeatherContainer}>
            <Text style={styles.temperature}>39°C</Text>
            <MaterialCommunityIcons
              name={getWeatherIcon('partlycloudy')}
              size={60}
              color="#6CAA64"
            />
          </View>

          {/* Details: Humidity, Wind Speed, Precipitation, Direction in two rows */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItemContainer}>
              <MaterialCommunityIcons name="water-outline" size={20} color="#555" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailValue}>19%</Text>
                <Text style={styles.detailLabel}>Humidity</Text>
              </View>
            </View>
            <View style={styles.detailItemContainer}>
              <MaterialCommunityIcons name="weather-windy" size={20} color="#555" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailValue}>13 km/h</Text>
                <Text style={styles.detailLabel}>Wind Speed</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailsRow}>
            <View style={styles.detailItemContainer}>
              <MaterialCommunityIcons name="weather-rainy" size={20} color="#555" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailValue}>40%</Text>
                <Text style={styles.detailLabel}>Precipitation</Text>
              </View>
            </View>
            <View style={styles.detailItemContainer}>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#555" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailValue}>East</Text>
                <Text style={styles.detailLabel}>Direction</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Forecast Card */}
        <View style={styles.forecastCard}>
          <Text style={styles.sectionTitle}>Forecast</Text>

          {/* Hourly Forecast */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyForecastContainer}>
            {hourlyForecast.map((hour, index) => (
              <View key={index} style={styles.hourlyItem}>
                <Text style={styles.hourlyTime}>{hour.time}</Text>
                <MaterialCommunityIcons name={getWeatherIcon(hour.condition)} size={30} color="#6CAA64" />
                <Text style={styles.hourlyTemp}>{hour.temp}</Text>
                <Text style={styles.hourlyRain}>{hour.rain}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Daily Forecast */}
          <View style={styles.dailyForecastContainer}>
            {dailyForecast.map((day, index) => (
              <View key={index} style={styles.dailyItem}>
                <Text style={styles.dailyDay}>{day.day}</Text>
                <View style={styles.dailyRainContainer}>
                  <MaterialCommunityIcons name="water-outline" size={18} color="#777" />
                  <Text style={styles.dailyRain}>{day.rain}</Text>
                </View>
                <Text style={styles.dailyTempHigh}>{day.high}</Text>
                <Text style={styles.dailyTempLow}>{day.low}</Text>
                <MaterialCommunityIcons name={getWeatherIcon(day.condition)} size={24} color="#6CAA64" />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WeatherScreen; 