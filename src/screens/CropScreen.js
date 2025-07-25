import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppBar from '../components/AppBar';

const CropCard = ({ name, alerts, field, temp, water, fertilizer }) => {
  const alertColor = alerts > 0 ? '#FF6B6B' : '#8BC34A';
  
  return (
    <View style={styles.card}>
      <View style={styles.cropHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="leaf" size={24} color="#8BC34A" />
        </View>
        <View style={styles.cropInfo}>
          <Text style={styles.cropName}>{name}</Text>
          <View style={styles.alertContainer}>
            <Ionicons 
              name={alerts > 0 ? "warning-outline" : "checkmark-circle-outline"} 
              size={14} 
              color={alertColor} 
            />
            <Text style={[styles.alertText, { color: alertColor }]}>
              {alerts > 0 ? `${alerts} Alerts` : 'No Alerts'}
            </Text>
            <Text style={styles.fieldText}>Field {field}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.metricsContainer}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Temp</Text>
          <Text style={styles.metricValue}>{temp}°C</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Water</Text>
          <Text style={styles.metricValue}>{water} Gallon</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Fertilizer</Text>
          <Text style={styles.metricValue}>{fertilizer}%</Text>
        </View>
      </View>
    </View>
  );
};

const CropScreen = () => {
  const navigation = useNavigation();
  const cropsData = [
    { id: 1, name: 'Bell Pepper', alerts: 0, field: 'A', temp: '34', water: '4', fertilizer: '70' },
    { id: 2, name: 'Wheat', alerts: 0, field: 'A', temp: '30', water: '12', fertilizer: '55' },
    { id: 3, name: 'Name 1', alerts: 0, field: 'A', temp: '37', water: '1', fertilizer: '97' },
    { id: 4, name: 'Cotton', alerts: 1, field: 'A', temp: '34', water: '4', fertilizer: '10' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppBar pageName="Plant page" title="My," subtitle="Crops" />
      
      <ScrollView style={styles.scrollView}>
        {cropsData.map(crop => (
          <CropCard
            key={crop.id}
            name={crop.name}
            alerts={crop.alerts}
            field={crop.field}
            temp={crop.temp}
            water={crop.water}
            fertilizer={crop.fertilizer}
          />
        ))}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => navigation.navigate('AddPlantScreen')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cropHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  alertText: {
    fontSize: 12,
    marginLeft: 4,
    marginRight: 10,
  },
  fieldText: {
    fontSize: 12,
    color: '#777',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#777',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6CAA64',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default CropScreen; 