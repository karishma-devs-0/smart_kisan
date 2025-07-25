import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const SIZE_OPTIONS = [
  { key: 'compact', label: 'Compact', icon: 'view-dashboard-outline' },
  { key: 'large', label: 'Large', icon: 'view-dashboard-variant' },
];

const WeatherSettingsScreen = () => {
  const navigation = useNavigation();
  const [selectedSize, setSelectedSize] = useState('compact');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    // In a real app, persist this setting (e.g., AsyncStorage, Redux, Context)
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom App Bar/Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Weather Settings</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Widget/Card Size</Text>
        <View style={styles.optionsRow}>
          {SIZE_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.key}
              style={[styles.optionButton, selectedSize === option.key && styles.selectedOption]}
              onPress={() => setSelectedSize(option.key)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={32}
                color={selectedSize === option.key ? '#1B5E20' : '#888'}
              />
              <Text style={[styles.optionLabel, selectedSize === option.key && { color: '#1B5E20', fontWeight: 'bold' }]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
      {saved && <Text style={styles.savedText}>Saved!</Text>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  header: {
    backgroundColor: '#1B5E20',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    padding: 4,
    zIndex: 2,
  },
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
    textAlign: 'center',
    flex: 1,
  },
  section: {
    marginBottom: 30,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#388e3c',
    marginBottom: 18,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  optionButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 22,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
    flex: 1,
  },
  selectedOption: {
    borderColor: '#1B5E20',
    borderWidth: 2,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  optionLabel: {
    marginTop: 10,
    fontSize: 15,
    color: '#888',
  },
  saveButton: {
    backgroundColor: '#1B5E20',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    marginHorizontal: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  savedText: {
    color: '#388e3c',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default WeatherSettingsScreen; 