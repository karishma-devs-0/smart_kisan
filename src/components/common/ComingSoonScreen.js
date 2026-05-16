import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

/**
 * ComingSoonScreen
 *
 * Shown for any feature that is partially implemented or using mock data.
 * Route params:
 *   - featureName (string): The name of the feature, shown as the title.
 *   - featureDescription (string): Optional short description of what the feature will do.
 *   - featureIcon (string): Optional MaterialCommunityIcons name for the feature icon.
 */
const ComingSoonScreen = ({ route }) => {
  const navigation = useNavigation();
  const featureName = route?.params?.featureName || 'This Feature';
  const featureDescription =
    route?.params?.featureDescription ||
    'We are working hard to bring you this feature. Stay tuned for the upcoming update!';
  const featureIcon = route?.params?.featureIcon || 'rocket-launch-outline';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#2E7D32" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Main Card */}
        <View style={styles.card}>
          {/* Icon Badge */}
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name={featureIcon} size={48} color="#2E7D32" />
          </View>

          {/* Coming Soon Badge */}
          <View style={styles.badge}>
            <MaterialCommunityIcons name="hammer-wrench" size={12} color="#F57F17" />
            <Text style={styles.badgeText}>Under Development</Text>
          </View>

          <Text style={styles.title}>{featureName}</Text>
          <Text style={styles.description}>{featureDescription}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          <Text style={styles.eta}>
            🚀 Coming in the next update
          </Text>
        </View>

        {/* Footer */}
        <TouchableOpacity
          style={styles.goBackBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="home-outline" size={18} color="#fff" />
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#C8E6C9',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE082',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F57F17',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#558B2F',
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E8F5E9',
    marginVertical: 20,
  },
  eta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  goBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 28,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  goBackText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ComingSoonScreen;
