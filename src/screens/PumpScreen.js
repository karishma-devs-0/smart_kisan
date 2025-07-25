import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppBar from '../components/AppBar';

// Custom Icon Components for different pump types
const PumpIcon = ({ type, size = 50 }) => {
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
    <View style={[styles.groupIcon, { width: size, height: size }]}>
      <Ionicons name={getIconName()} size={size * 0.6} color="#6CAA64" />
    </View>
  );
};

// Individual Pump Card Component
const PumpCard = ({ pump, mode }) => {
  return (
    <View style={styles.pumpCard}>
      <View style={styles.pumpHeader}>
        <View style={styles.pumpIconContainer}>
          <Ionicons name="water-outline" size={24} color="#6CAA64" />
        </View>
        <View style={styles.pumpInfo}>
          <Text style={styles.pumpName}>Pump {pump.id}</Text>
          {mode === 'manual' && pump.status && (
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: pump.status === 'Online' ? '#8BC34A' : '#FFB74D' }]} />
              <Text style={styles.statusText}>{pump.status}</Text>
            </View>
          )}
          {mode === 'automatic' && (
            <Text style={styles.sensorText}>Sensor: {pump.sensor}</Text>
          )}
          {mode === 'timer' && (
            <Text style={styles.timerText}>Timer</Text>
          )}
        </View>
        <TouchableOpacity style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={20} color="#777" />
        </TouchableOpacity>
      </View>

      <View style={styles.pumpDetails}>
        {pump.field && (
          <Text style={styles.detailText}>Pump operational in : Field {pump.field}</Text>
        )}
        
        {pump.hours && (
          <Text style={styles.detailText}>Hours used today : {pump.hours}</Text>
        )}
        
        {mode === 'timer' && (
          <Text style={styles.detailText}>Set Timer for {pump.timer} mins</Text>
        )}
        
        {mode === 'automatic' && pump.schedule && (
          <Text style={styles.detailText}>Next scheduled time : {pump.schedule}</Text>
        )}
      </View>
    </View>
  );
};

// Pump Group Component for Edit Groups tab
const PumpGroupCard = ({ group }) => {
  return (
    <View style={styles.pumpGroupCard}>
      <View style={styles.pumpGroupHeader}>
        <PumpIcon type={group.type} size={50} />
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.pumps.map((pump, index) => (
            <View key={index} style={styles.pumpStatusRow}>
              <Text style={styles.pumpStatusText}>Pump {pump.id} :</Text>
              <Text style={[styles.pumpStatusValue, { color: pump.status === 'On' ? '#8BC34A' : '#777' }]}>
                {pump.status === 'On' ? '• On' : '• Off'}
              </Text>
              <Text style={[styles.pumpStatusValue, { color: pump.alternateStatus === 'On' ? '#8BC34A' : '#777', marginLeft: 8 }]}>
                {pump.alternateStatus === 'On' ? 'On' : 'Off'}
              </Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={20} color="#777" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PumpScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('groups'); // 'manual', 'automatic', 'timer', 'groups'
  
  // Sample data for each mode
  const manualPumps = [
    { id: 1, status: 'Online', field: 'A', hours: '02 hours 23 mins' },
    { id: 2, status: 'Offline', field: 'A', hours: '00 hours 00 mins' },
    { id: 3, status: 'Online', field: 'A', hours: '02 hours 23 mins' }
  ];
  
  const automaticPumps = [
    { id: 3, sensor: 'based', field: 'A', hours: '02 hours 23 mins' },
    { id: 'EggPlant', sensor: 'based', field: 'A', schedule: '09:00 AM - 06:00 PM' },
    { id: 'B', sensor: 'based', field: 'A', hours: '02 hours 23 mins' }
  ];
  
  const timerPumps = [
    { id: 1, timer: '30', field: 'A' },
    { id: 2, timer: '30', field: 'A' },
    { id: 3, timer: '30', field: 'A' }
  ];

  const pumpGroups = [
    { 
      name: 'Field A', 
      type: 'field',
      pumps: [
        { id: 1, status: 'On', alternateStatus: 'Off' },
        { id: 2, status: 'Off', alternateStatus: 'On' }
      ]
    },
    { 
      name: 'Irrigation', 
      type: 'irrigation',
      pumps: [
        { id: 2, status: 'Off', alternateStatus: 'On' }
      ]
    },
    { 
      name: 'Pond', 
      type: 'pond',
      pumps: [
        { id: 2, status: 'Off', alternateStatus: 'On' }
      ]
    },
    { 
      name: 'Borewell', 
      type: 'borewell',
      pumps: [
        { id: 2, status: 'Off', alternateStatus: 'On' }
      ]
    }
  ];
  
  // Get the active pumps based on selected tab
  const getActivePumps = () => {
    switch (activeTab) {
      case 'manual':
        return manualPumps;
      case 'automatic':
        return automaticPumps;
      case 'timer':
        return timerPumps;
      default:
        return [];
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'groups') {
      return (
        <>
          <View style={styles.editGroupsHeader}>
            <Text style={styles.editGroupsTitle}>Edit Pump Groups</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.headerIconButton}>
                <Ionicons name="notifications-outline" size={20} color="#FF6B6B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconButton}>
                <Ionicons name="settings-outline" size={20} color="#777" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.scrollView}>
            {pumpGroups.map((group, index) => (
              <PumpGroupCard key={index} group={group} />
            ))}
            
            <TouchableOpacity 
              style={styles.addGroupButton}
              onPress={() => navigation.navigate('AddPumpGroupScreen')}
            >
              <Text style={styles.addGroupText}>Add new pump group</Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      );
    } else {
      return (
        <>
          {/* Mode Selection Tabs */}
          <View style={styles.modeSelectionContainer}>
            <Text style={styles.modeSelectionText}>Mode Selection</Text>
            <View style={styles.modeIcons}>
              <TouchableOpacity>
                <Ionicons name="water-outline" size={20} color="#6CAA64" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="notifications-outline" size={20} color="#FF6B6B" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="settings-outline" size={20} color="#777" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'manual' && styles.activeTabItem]} 
              onPress={() => setActiveTab('manual')}
            >
              <Ionicons 
                name="hand-left-outline" 
                size={24} 
                color={activeTab === 'manual' ? '#6CAA64' : '#777'} 
              />
              <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>Manual</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'automatic' && styles.activeTabItem]} 
              onPress={() => setActiveTab('automatic')}
            >
              <Ionicons 
                name="settings-outline" 
                size={24} 
                color={activeTab === 'automatic' ? '#6CAA64' : '#777'} 
              />
              <Text style={[styles.tabText, activeTab === 'automatic' && styles.activeTabText]}>Automatic</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'timer' && styles.activeTabItem]} 
              onPress={() => setActiveTab('timer')}
            >
              <Ionicons 
                name="timer-outline" 
                size={24} 
                color={activeTab === 'timer' ? '#6CAA64' : '#777'} 
              />
              <Text style={[styles.tabText, activeTab === 'timer' && styles.activeTabText]}>Timer</Text>
            </TouchableOpacity>
          </View>
          
          {/* Individual Pump Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Individual Pump</Text>
          </View>
          
          {/* Pump List */}
          <ScrollView style={styles.scrollView}>
            {getActivePumps().map((pump, index) => (
              <PumpCard key={index} pump={pump} mode={activeTab} />
            ))}
          </ScrollView>
          
          {/* Emergency Stop Button */}
          <TouchableOpacity style={styles.emergencyButton}>
            <Text style={styles.emergencyButtonText}>Emergency Stop all Pumps</Text>
          </TouchableOpacity>
        </>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppBar pageName={activeTab === 'groups' ? "Edit pump screen" : "Pump page"} title="My," subtitle="Pumps" />
      
      {/* Main Navigation Tabs */}
      <View style={styles.mainTabBar}>
        <TouchableOpacity 
          style={[styles.mainTabItem, activeTab !== 'groups' && styles.activeMainTabItem]} 
          onPress={() => setActiveTab('manual')}
        >
          <Text style={styles.mainTabText}>Control</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.mainTabItem, activeTab === 'groups' && styles.activeMainTabItem]} 
          onPress={() => setActiveTab('groups')}
        >
          <Text style={styles.mainTabText}>Groups</Text>
        </TouchableOpacity>
      </View>
      
      {renderTabContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  mainTabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeMainTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#6CAA64',
  },
  mainTabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  modeSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    margin: 16,
  },
  modeSelectionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modeIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 16,
    borderRadius: 10,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  activeTabItem: {
    backgroundColor: '#e8f5e9',
  },
  tabText: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
  },
  activeTabText: {
    color: '#6CAA64',
    fontWeight: 'bold',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  pumpCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pumpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pumpIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pumpInfo: {
    flex: 1,
  },
  pumpName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#777',
  },
  sensorText: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  timerText: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  arrowButton: {
    padding: 4,
  },
  pumpDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  detailText: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
  },
  emergencyButton: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Edit Groups styles
  editGroupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editGroupsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIconButton: {
    padding: 4,
  },
  pumpGroupCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pumpGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pumpStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pumpStatusText: {
    fontSize: 14,
    color: '#333',
  },
  pumpStatusValue: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  addGroupButton: {
    backgroundColor: '#000',
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addGroupText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PumpScreen; 