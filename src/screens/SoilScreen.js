import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import AppBar from '../components/AppBar';
// import styles from '../style/SoilScreenStyle'; // Style file will be created next

const SoilScreen = () => {
  const navigation = useNavigation(); // Get the navigation object

  // Placeholder data
  const moistureDetails = 'Bell Pepper';
  const currentMoisture = '30%';
  const moistureDescription = 'The soil moisture content is adequate. Ensure regular irrigation to maintain this level.';
  const plantImageUrl = 'https://via.placeholder.com/150'; // Placeholder image URL

  // Placeholder data for the graph (simple representation)
  const moistureData = [
    { time: '10', value: 6 },
    { time: '4', value: 3 },
    { time: '6', value: 4 },
    { time: '2', value: 2 },
    { time: '6', value: 5 },
  ];

  return (
    <SafeAreaView style={/* styles.container */ { flex: 1, backgroundColor: '#fff' }}>
      <AppBar pageName="Soil page" title="My," subtitle="Soil" />

      <ScrollView style={/* styles.scrollViewContent */ { flexGrow: 1 }}>
        {/* Moisture Details */}
        <View style={/* styles.detailCard */ { backgroundColor: 'white', borderRadius: 10, marginHorizontal: 15, marginTop: 20, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <Text style={/* styles.sectionTitle */ { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>Moisture Details</Text>
          <Text style={/* styles.detailText */ { fontSize: 16, color: '#555' }}>{moistureDetails}</Text>
        </View>

        {/* Soil Moisture Content Card */}
        <View style={/* styles.contentCard */ { backgroundColor: 'white', borderRadius: 10, marginHorizontal: 15, marginTop: 15, padding: 15, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <View style={/* styles.textContent */ { flex: 1, marginRight: 10 }}>
            <Text style={/* styles.sectionTitle */ { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#333' }}>Soil Moisture Content</Text>
            <Text style={/* styles.currentMoisture */ { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 }}>Current Moisture: {currentMoisture}</Text>
            <Text style={/* styles.moistureDescription */ { fontSize: 14, color: '#555' }}>{moistureDescription}</Text>
          </View>
          <Image
            style={/* styles.plantImage */ { width: 80, height: 80, borderRadius: 10 }}
            source={{ uri: plantImageUrl }}
          />
        </View>

        {/* Moisture over time Card */}
        <View style={/* styles.graphCard */ { backgroundColor: 'white', borderRadius: 10, marginHorizontal: 15, marginTop: 15, marginBottom: 20, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <View style={/* styles.graphHeader */ { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
             <Text style={/* styles.sectionTitle */ { fontSize: 18, fontWeight: 'bold', color: '#333' }}>Moisture over time</Text>
             <Text style={/* styles.dailyAverage */ { fontSize: 14, color: '#555' }}>Daily Average</Text>
          </View>
          {/* Placeholder for Graph - A real graph would use a library */}
          <View style={/* styles.graphPlaceholder */ { height: 150, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }}>
            <Text>Graph Placeholder</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SoilScreen; 