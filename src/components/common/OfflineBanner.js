import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onNetworkChange, getIsConnected } from '../../services/network';

const BANNER_HEIGHT = 36;

export default function OfflineBanner() {
  // Start hidden — only show after confirmed offline for 2 seconds
  const [offline, setOffline] = useState(false);
  const slideAnim = useRef(new Animated.Value(-BANNER_HEIGHT)).current;
  const insets = useSafeAreaInsets();
  const offlineTimer = useRef(null);

  useEffect(() => {
    const unsubscribe = onNetworkChange((connected) => {
      if (!connected) {
        // Delay showing the banner to avoid flash on app start
        offlineTimer.current = setTimeout(() => setOffline(true), 2000);
      } else {
        if (offlineTimer.current) clearTimeout(offlineTimer.current);
        setOffline(false);
      }
    });
    return () => {
      unsubscribe();
      if (offlineTimer.current) clearTimeout(offlineTimer.current);
    };
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: offline ? 0 : -BANNER_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [offline]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          top: insets.top,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.inner}>
        <MaterialCommunityIcons name="wifi-off" size={16} color="#FFF" />
        <Text style={styles.text}>You're offline — showing cached data</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    height: BANNER_HEIGHT,
  },
  inner: {
    flex: 1,
    backgroundColor: '#E65100',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  text: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});
