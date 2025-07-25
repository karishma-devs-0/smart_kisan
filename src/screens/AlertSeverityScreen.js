import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppBar from '../components/AppBar';

const AlertSeverityScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <AppBar
        pageName="Caution, Alert !!!"
        title="Caution,"
        subtitle="Alert !!!"
        onSettingsPress={() => {}}
      />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.sectionTitle}>Alert Severity Levels</Text>
        <TouchableOpacity style={styles.severityCard}>
          <View style={styles.severityDotCritical} />
          <View style={{ flex: 1 }}>
            <Text style={styles.severityTitle}>Critical Alerts</Text>
            <Text style={styles.severityDesc}>High-priority alerts requiring immediate attention</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bbb" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.severityCard}>
          <View style={styles.severityDotWarning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.severityTitle}>Warning Alerts</Text>
            <Text style={styles.severityDesc}>Medium-priority alerts for potential issues</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bbb" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.severityCard}>
          <View style={styles.severityDotInfo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.severityTitle}>Information Alerts</Text>
            <Text style={styles.severityDesc}>Low-priority updates and system information</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bbb" />
        </TouchableOpacity>
        <View style={styles.customRulesHeader}>
          <Text style={styles.sectionTitle}>Custom Alert Rules</Text>
          <TouchableOpacity style={styles.addRuleButton}>
            <Ionicons name="add-circle" size={28} color="#6CAA64" />
          </TouchableOpacity>
        </View>
        <View style={styles.ruleCard}>
          <Text style={styles.ruleTitle}>Water Level Low</Text>
          <Text style={styles.ruleDetail}>Severity: <Text style={styles.critical}>Critical</Text></Text>
          <Text style={styles.ruleDetail}>Channels: In-app, SMS</Text>
        </View>
        <View style={styles.ruleCard}>
          <Text style={styles.ruleTitle}>Temperature Alert</Text>
          <Text style={styles.ruleDetail}>Severity: <Text style={styles.warning}>Warning</Text></Text>
          <Text style={styles.ruleDetail}>Channels: In-app</Text>
        </View>
        <View style={styles.ruleCard}>
          <Text style={styles.ruleTitle}>System Update</Text>
          <Text style={styles.ruleDetail}>Severity: <Text style={styles.info}>Info</Text></Text>
          <Text style={styles.ruleDetail}>Channels: Email</Text>
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#222' },
  severityCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f7f7', borderRadius: 12, padding: 14, marginBottom: 12,
  },
  severityDotCritical: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF4D4F', marginRight: 14 },
  severityDotWarning: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFD600', marginRight: 14 },
  severityDotInfo: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2196F3', marginRight: 14 },
  severityTitle: { fontWeight: 'bold', fontSize: 16, color: '#222' },
  severityDesc: { fontSize: 13, color: '#888' },
  customRulesHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 8 },
  addRuleButton: { marginLeft: 8 },
  ruleCard: { backgroundColor: '#f7f7f7', borderRadius: 12, padding: 14, marginBottom: 12 },
  ruleTitle: { fontWeight: 'bold', fontSize: 15, color: '#222', marginBottom: 4 },
  ruleDetail: { fontSize: 13, color: '#555' },
  critical: { color: '#FF4D4F', fontWeight: 'bold' },
  warning: { color: '#FFD600', fontWeight: 'bold' },
  info: { color: '#2196F3', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#6CAA64', borderRadius: 8, margin: 20, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default AlertSeverityScreen; 