import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../constants/typography';
import { SPACING } from '../constants/spacing';
import { TAB_BAR } from '../constants/layout';

const TAB_CONFIG = [
  { name: 'HomeTab', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'PumpsTab', label: 'Pump', icon: 'water-pump', activeIcon: 'water-pump' },
  { name: 'SoilTab', label: 'Soil', icon: 'leaf-circle-outline', activeIcon: 'leaf-circle' },
  { name: 'WeatherTab', label: 'Sky', icon: 'weather-partly-cloudy', activeIcon: 'weather-partly-cloudy' },
  { name: 'SettingsTab', label: 'More', icon: 'cog-outline', activeIcon: 'cog' },
];

const TabItem = ({ tab, isFocused, onPress, onLongPress }) => {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [isFocused, scaleAnim]);

  const pillScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const pillOpacity = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const iconOpacity = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={tab.label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab}
    >
      {/* Inactive icon (fades out) */}
      <Animated.View style={[styles.inactiveIcon, { opacity: iconOpacity }]}>
        <MaterialCommunityIcons
          name={tab.icon}
          size={22}
          color="#B0B0C0"
        />
      </Animated.View>

      {/* Active pill (scales + fades in) */}
      <Animated.View
        style={[
          styles.activePill,
          {
            opacity: pillOpacity,
            transform: [{ scale: pillScale }],
          },
        ]}
      >
        <MaterialCommunityIcons
          name={tab.activeIcon}
          size={22}
          color={COLORS.white}
        />
        <Text style={styles.activeLabel}>{tab.label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outerContainer, { paddingBottom: Math.max(insets.bottom, TAB_BAR.marginBottom) }]}>
      <View style={styles.floatingBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = TAB_CONFIG[index];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              tab={tab}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: TAB_BAR.marginHorizontal,
  },
  floatingBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.darkBg,
    borderRadius: TAB_BAR.borderRadius,
    height: TAB_BAR.height,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  inactiveIcon: {
    position: 'absolute',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  activeLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
});

export default CustomTabBar;
