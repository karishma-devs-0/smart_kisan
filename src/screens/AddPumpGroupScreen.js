import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput,
  ScrollView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppBar from '../components/AppBar';

const PumpTypeOption = ({ type, name, selected, onSelect }) => {
  const getIconName = () => {
    switch (type) {
      case 'field':
        return 'leaf-outline';
      case 'irrigation':
        return 'water-outline';
      case 'pond':
        return 'boat-outline';
      case 'borewell':
        return 'sunny-outline';
      default:
        return 'water-outline';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.typeOption, selected && styles.selectedTypeOption]}
      onPress={() => onSelect(type)}
    >
      <View style={styles.typeIconContainer}>
        <Ionicons name={getIconName()} size={30} color={selected ? 'white' : '#6CAA64'} />
      </View>
      <Text style={[styles.typeText, selected && styles.selectedTypeText]}>{name}</Text>
    </TouchableOpacity>
  );
};

const PumpSelectionItem = ({ pump, selected, onToggle }) => {
  return (
    <View style={styles.pumpSelectionItem}>
      <View style={styles.pumpInfo}>
        <Text style={styles.pumpName}>Pump {pump.id}</Text>
        <Text style={styles.pumpLocation}>Field {pump.field}</Text>
      </View>
      <Switch
        value={selected}
        onValueChange={onToggle}
        trackColor={{ false: '#d9d9d9', true: '#a8d5a2' }}
        thumbColor={selected ? '#6CAA64' : '#f4f3f4'}
      />
    </View>
  );
};

const AddPumpGroupScreen = () => {
  const navigation = useNavigation();
  const [groupName, setGroupName] = useState('');
  const [selectedType, setSelectedType] = useState('field');
  const [selectedPumps, setSelectedPumps] = useState({});

  // Sample available pumps
  const availablePumps = [
    { id: 1, field: 'A' },
    { id: 2, field: 'A' },
    { id: 3, field: 'B' },
    { id: 4, field: 'C' },
  ];

  const togglePumpSelection = (pumpId) => {
    setSelectedPumps(prev => ({
      ...prev,
      [pumpId]: !prev[pumpId]
    }));
  };

  const handleCreateGroup = () => {
    // Here you would save the new pump group
    // For now, just navigate back
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppBar pageName="Add new pump group" title="New," subtitle="Group" />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          {/* Group Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Group Name *</Text>
            <TextInput
              style={styles.textInput}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name"
            />
          </View>

          {/* Group Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Group Type</Text>
            <View style={styles.typeOptionsContainer}>
              <PumpTypeOption 
                type="field" 
                name="Field" 
                selected={selectedType === 'field'} 
                onSelect={setSelectedType} 
              />
              <PumpTypeOption 
                type="irrigation" 
                name="Irrigation" 
                selected={selectedType === 'irrigation'} 
                onSelect={setSelectedType} 
              />
              <PumpTypeOption 
                type="pond" 
                name="Pond" 
                selected={selectedType === 'pond'} 
                onSelect={setSelectedType} 
              />
              <PumpTypeOption 
                type="borewell" 
                name="Borewell" 
                selected={selectedType === 'borewell'} 
                onSelect={setSelectedType} 
              />
            </View>
          </View>

          {/* Pump Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Pumps</Text>
            <View style={styles.pumpSelectionContainer}>
              {availablePumps.map((pump) => (
                <PumpSelectionItem 
                  key={pump.id}
                  pump={pump}
                  selected={!!selectedPumps[pump.id]}
                  onToggle={() => togglePumpSelection(pump.id)}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

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
          onPress={handleCreateGroup}
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
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
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
  typeOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeOption: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedTypeOption: {
    backgroundColor: '#6CAA64',
    borderColor: '#6CAA64',
  },
  typeIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedTypeText: {
    color: 'white',
  },
  pumpSelectionContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pumpSelectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pumpInfo: {
    flex: 1,
  },
  pumpName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  pumpLocation: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
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

export default AddPumpGroupScreen; 