import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AppBar from '../components/AppBar';

const AlertSettingsScreen = ({ navigation }) => {
  const [inApp, setInApp] = useState(true);
  const [sms, setSms] = useState(true);
  const [email, setEmail] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <AppBar
        pageName="Caution, Alert !!!"
        title="Caution,"
        subtitle="Alert !!!"
        onSettingsPress={() => {}}
      />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.sectionTitle}>Alert Settings</Text>
        <Text style={styles.subSectionTitle}>Notification Channels</Text>
        <View style={styles.channelCard}>
          <Ionicons name="notifications" size={24} color="#6CAA64" style={styles.channelIcon} />
          <Text style={styles.channelText}>In-app Notifications</Text>
          <Switch value={inApp} onValueChange={setInApp} trackColor={{ true: '#6CAA64' }} />
        </View>
        <View style={styles.channelCard}>
          <MaterialIcons name="sms" size={24} color="#6CAA64" style={styles.channelIcon} />
          <Text style={styles.channelText}>SMS Alerts</Text>
          <Switch value={sms} onValueChange={setSms} trackColor={{ true: '#6CAA64' }} />
        </View>
        <View style={styles.channelCard}>
          <MaterialIcons name="email" size={24} color="#6CAA64" style={styles.channelIcon} />
          <Text style={styles.channelText}>Email Notifications</Text>
          <Switch value={email} onValueChange={setEmail} trackColor={{ true: '#6CAA64' }} />
        </View>
        <Text style={[styles.subSectionTitle, { marginTop: 24 }]}>Alert Severity Levels</Text>
        <TouchableOpacity style={styles.severityCard} onPress={() => navigation.navigate('AlertSeverityScreen')}>
          <View style={styles.severityDotCritical} />
          <View style={{ flex: 1 }}>
            <Text style={styles.severityTitle}>Critical Alerts</Text>
            <Text style={styles.severityDesc}>High-priority alerts requiring immediate attention</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bbb" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.severityCard} onPress={() => navigation.navigate('AlertSeverityScreen')}>
          <View style={styles.severityDotWarning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.severityTitle}>Warning Alerts</Text>
            <Text style={styles.severityDesc}>Medium-priority alerts for potential issues</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bbb" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.severityCard} onPress={() => navigation.navigate('AlertSeverityScreen')}>
          <View style={styles.severityDotInfo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.severityTitle}>Information Alerts</Text>
            <Text style={styles.severityDesc}>Low-priority updates and system information</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bbb" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#222' },
  subSectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  channelCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f7f7', borderRadius: 12, padding: 14, marginBottom: 12,
  },
  channelIcon: { marginRight: 12 },
  channelText: { flex: 1, fontSize: 16, color: '#222' },
  severityCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f7f7', borderRadius: 12, padding: 14, marginBottom: 12,
  },
  severityDotCritical: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF4D4F', marginRight: 14 },
  severityDotWarning: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFD600', marginRight: 14 },
  severityDotInfo: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2196F3', marginRight: 14 },
  severityTitle: { fontWeight: 'bold', fontSize: 16, color: '#222' },
  severityDesc: { fontSize: 13, color: '#888' },
});

export default AlertSettingsScreen; 