import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { TAB_BAR, SCREEN_HEADER } from '../../constants/layout';

const ScreenLayout = ({
  title,
  prefix,
  showBack = false,
  onBack,
  rightActions = [],
  children,
  scrollable = true,
  refreshControl,
  renderCustomHeader,
  hasTabBar = true,
  renderBottomOverlay,
}) => {
  const insets = useSafeAreaInsets();

  const tabBarBottomPadding = hasTabBar
    ? TAB_BAR.height + TAB_BAR.marginBottom + Math.max(insets.bottom, 12) + 8
    : insets.bottom + 8;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryLight} />

      {/* Green header background */}
      <View style={[styles.greenHeader, {
        height: SCREEN_HEADER.defaultHeight + insets.top,
        paddingTop: insets.top,
      }]}>
        {renderCustomHeader ? (
          renderCustomHeader()
        ) : (
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              {showBack && (
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
                </TouchableOpacity>
              )}
              <View style={styles.titleContainer}>
                {prefix ? <Text style={styles.prefixText}>{prefix}</Text> : null}
                {title ? <Text style={styles.titleText}> {title}</Text> : null}
              </View>
            </View>
            {rightActions.length > 0 && (
              <View style={styles.headerRight}>
                {rightActions.map((action, index) => (
                  <TouchableOpacity key={index} onPress={action.onPress} style={styles.headerActionButton}>
                    <MaterialCommunityIcons name={action.icon} size={20} color={COLORS.white} />
                    {action.badge && <View style={styles.actionBadge} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* White canvas with rounded top corners */}
      {scrollable ? (
        <ScrollView
          style={styles.whiteCanvas}
          contentContainerStyle={{
            paddingBottom: tabBarBottomPadding,
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.xl,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.whiteCanvas, { flex: 1 }]}>
          {children}
        </View>
      )}

      {/* Bottom overlay (emergency stop button, FAB, etc.) */}
      {renderBottomOverlay && renderBottomOverlay({ tabBarBottomPadding })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
  },
  greenHeader: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'flex-end',
    paddingBottom: SCREEN_HEADER.canvasOverlap + SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  prefixText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    opacity: 0.85,
  },
  titleText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  whiteCanvas: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SCREEN_HEADER.canvasBorderRadius,
    borderTopRightRadius: SCREEN_HEADER.canvasBorderRadius,
    marginTop: -SCREEN_HEADER.canvasOverlap,
  },
});

export default ScreenLayout;
