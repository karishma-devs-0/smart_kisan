import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WeatherTodayScreen from '../features/weather/screens/WeatherTodayScreen';
import WeatherForecastScreen from '../features/weather/screens/WeatherForecastScreen';
import HistoricalWeatherScreen from '../features/weather/screens/HistoricalWeatherScreen';
import WindDetailScreen from '../features/weather/screens/WindDetailScreen';
import HumidityDetailScreen from '../features/weather/screens/HumidityDetailScreen';

const Stack = createNativeStackNavigator();

const WeatherStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#4CAF50' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="WeatherToday" component={WeatherTodayScreen} />
      <Stack.Screen name="WeatherForecast" component={WeatherForecastScreen} />
      <Stack.Screen name="HistoricalWeather" component={HistoricalWeatherScreen} />
      <Stack.Screen name="WindDetail" component={WindDetailScreen} />
      <Stack.Screen name="HumidityDetail" component={HumidityDetailScreen} />
    </Stack.Navigator>
  );
};

export default WeatherStack;
