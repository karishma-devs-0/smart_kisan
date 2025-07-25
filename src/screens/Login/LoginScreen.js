import React, { useState } from 'react';
import { View, Image, StyleSheet, Dimensions, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import styles from '../../style/LoginScreenStyle';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Phone'); // State for active tab, default to Phone based on image
  const [showOtp, setShowOtp] = useState(false); // State to toggle OTP visibility icon
  const [countryCode, setCountryCode] = useState('91');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Simple country data
  const countries = [
    { code: 'IN', name: 'India', callingCode: '91' },
    { code: 'US', name: 'United States', callingCode: '1' },
    { code: 'GB', name: 'United Kingdom', callingCode: '44' },
    { code: 'CA', name: 'Canada', callingCode: '1' },
    { code: 'AU', name: 'Australia', callingCode: '61' },
  ];

  const renderInputFields = () => {
    switch (activeTab) {
      case 'Email':
        return (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry
            />
          </View>
        );
      case 'Phone':
        return (
          <View>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryPicker}>
                <Picker
                  selectedValue={countryCode}
                  style={styles.picker}
                  onValueChange={(itemValue) => setCountryCode(itemValue)}
                >
                  {countries.map((country) => (
                    <Picker.Item 
                      key={country.code} 
                      label={`+${country.callingCode} ${country.name}`} 
                      value={country.callingCode} 
                    />
                  ))}
                </Picker>
              </View>
              <TextInput
                style={styles.phoneNumberInput}
                placeholder="Phone Number"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
              />
            </View>

      
            <View style={styles.otpInputContainer}>
              <TextInput
                style={styles.otpInput}
                placeholder="OTP"
                placeholderTextColor="#888"
                keyboardType="number-pad"
                secureTextEntry={!showOtp} // Toggle secure text entry
              />
              <TouchableOpacity onPress={() => setShowOtp(!showOtp)} style={styles.eyeIconContainer}>
                <MaterialIcons 
                  name={showOtp ? "visibility" : "visibility-off"} 
                  size={24} 
                  color="#888"
                />
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'Username':
        return (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
      {/* Top Section with Logo and Text */}
      <View style={styles.topContainer}>
        <Image
          source={require('../../assets/SmartKisanLogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoTitleText}>SmartKisan</Text>
        <Text style={styles.logoSubtitle}>PRECISION AGRICULTURE</Text>
      </View>

      {/* Bottom White Card Section */}
      <View style={styles.bottomContainer}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity onPress={() => setActiveTab('Email')}>
            <Text style={[styles.tabText, activeTab === 'Email' && styles.activeTabText]}>Email</Text>
            {activeTab === 'Email' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('Phone')}>
            <Text style={[styles.tabText, activeTab === 'Phone' && styles.activeTabText]}>Phone</Text>
            {activeTab === 'Phone' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('Username')}>
            <Text style={[styles.tabText, activeTab === 'Username' && styles.activeTabText]}>Username</Text>
            {activeTab === 'Username' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Render Input Fields based on Active Tab */}
        {renderInputFields()}

        {/* Forgot Password / Local Mode */}
        <View style={styles.linkRow}>
          <TouchableOpacity>
            <Text style={styles.linkText}>Forgot Password ?</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.linkText}>Local Mode</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('WeatherScreen')}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default LoginScreen; 