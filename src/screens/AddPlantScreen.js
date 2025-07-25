import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppBar from '../components/AppBar';

const AddPlantScreen = () => {
  const navigation = useNavigation();
  const [plantName, setPlantName] = useState('');
  const [selectedField, setSelectedField] = useState('A');
  const [selectedPlantType, setSelectedPlantType] = useState('');
  const [wateringSchedule, setWateringSchedule] = useState('');
  const [fertilizerSchedule, setFertilizerSchedule] = useState('');

  const fields = ['A', 'B', 'C', 'D'];
  const plantTypes = ['Wheat', 'Rice', 'Cotton', 'Bell Pepper', 'Tomato', 'Potato'];

  const handleCreatePlant = () => {
    // Here you would typically save the plant data to your database or state
    // For now, we'll just navigate back to the crops screen
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppBar pageName="Add new Plant" title="New," subtitle="Plant" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            {/* Plant Image Selection */}
            <View style={styles.imageContainer}>
              <View style={styles.imagePlaceholder}>
                <Ionicons name="leaf" size={40} color="#8BC34A" />
              </View>
              <TouchableOpacity style={styles.cameraButton}>
                <Ionicons name="camera" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Plant Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Plant Name *</Text>
              <TextInput
                style={styles.textInput}
                value={plantName}
                onChangeText={setPlantName}
                placeholder="Enter plant name"
              />
            </View>

            {/* Field Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Field</Text>
              <View style={styles.optionsContainer}>
                {fields.map((field) => (
                  <TouchableOpacity
                    key={field}
                    style={[
                      styles.optionButton,
                      selectedField === field && styles.selectedOption
                    ]}
                    onPress={() => setSelectedField(field)}
                  >
                    <Text 
                      style={[
                        styles.optionText,
                        selectedField === field && styles.selectedOptionText
                      ]}
                    >
                      {field}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Plant Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Plant Type</Text>
              <View style={styles.plantTypesContainer}>
                {plantTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.plantTypeButton,
                      selectedPlantType === type && styles.selectedPlantType
                    ]}
                    onPress={() => setSelectedPlantType(type)}
                  >
                    <Text 
                      style={[
                        styles.plantTypeText,
                        selectedPlantType === type && styles.selectedPlantTypeText
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Watering Schedule */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Watering Schedule</Text>
              <TextInput
                style={styles.textInput}
                value={wateringSchedule}
                onChangeText={setWateringSchedule}
                placeholder="E.g., Every 2 days"
              />
            </View>

            {/* Fertilizer Schedule */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fertilizer Schedule</Text>
              <TextInput
                style={styles.textInput}
                value={fertilizerSchedule}
                onChangeText={setFertilizerSchedule}
                placeholder="E.g., Once a month"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreatePlant}
        >
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#000',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: '#6CAA64',
    borderColor: '#6CAA64',
  },
  optionText: {
    color: '#555',
  },
  selectedOptionText: {
    color: 'white',
  },
  plantTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  plantTypeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedPlantType: {
    backgroundColor: '#6CAA64',
    borderColor: '#6CAA64',
  },
  plantTypeText: {
    color: '#555',
  },
  selectedPlantTypeText: {
    color: 'white',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#6CAA64',
    paddingVertical: 15,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddPlantScreen; 