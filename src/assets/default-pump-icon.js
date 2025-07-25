import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DefaultPumpIcon = ({ size = 50, color = '#6CAA64' }) => {
  return (
    <View style={{ 
      width: size, 
      height: size, 
      backgroundColor: '#f0f0f0', 
      borderRadius: 8, 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <Ionicons name="water-outline" size={size * 0.6} color={color} />
    </View>
  );
};

export default DefaultPumpIcon; 