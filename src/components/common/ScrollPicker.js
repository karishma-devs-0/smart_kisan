import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONT_WEIGHTS } from '../../constants/typography';

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PADDING = ITEM_HEIGHT * 2; // space above/below so any item can be centered

const ScrollPicker = ({ values, selectedValue, onValueChange, label, width = 70 }) => {
  const scrollRef = useRef(null);
  const isUserScrolling = useRef(false);

  useEffect(() => {
    const idx = values.indexOf(selectedValue);
    if (idx >= 0 && scrollRef.current && !isUserScrolling.current) {
      scrollRef.current.scrollTo({
        y: idx * ITEM_HEIGHT,
        animated: false,
      });
    }
  }, [selectedValue, values]);

  const handleScrollEnd = (e) => {
    isUserScrolling.current = false;
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));

    // Snap to nearest item
    scrollRef.current?.scrollTo({
      y: clamped * ITEM_HEIGHT,
      animated: true,
    });

    if (values[clamped] !== selectedValue) {
      onValueChange(values[clamped]);
    }
  };

  const handleScrollBegin = () => {
    isUserScrolling.current = true;
  };

  return (
    <View style={[styles.container, { width }]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.pickerWrap, { height: PICKER_HEIGHT }]}>
        {/* Selection highlight band */}
        <View style={styles.highlight} pointerEvents="none" />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate={Platform.OS === 'ios' ? 'normal' : 0.92}
          onScrollBeginDrag={handleScrollBegin}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={(e) => {
            // If no momentum, handle immediately
            if (Math.abs(e.nativeEvent.velocity?.y || 0) < 0.1) {
              handleScrollEnd(e);
            }
          }}
          contentContainerStyle={{ paddingVertical: PADDING }}
          bounces={false}
          overScrollMode="never"
          nestedScrollEnabled
        >
          {values.map((val) => {
            const isSelected = val === selectedValue;
            return (
              <View key={val} style={[styles.item, { height: ITEM_HEIGHT }]}>
                <Text
                  style={[
                    styles.itemText,
                    isSelected ? styles.itemSelected : styles.itemDim,
                  ]}
                >
                  {String(val).padStart(2, '0')}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  pickerWrap: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    backgroundColor: COLORS.primarySurface || 'rgba(76,175,80,0.12)',
    borderRadius: 10,
    zIndex: 0,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
  },
  itemSelected: {
    color: COLORS.primary,
    fontSize: 28,
  },
  itemDim: {
    color: COLORS.textTertiary,
    fontSize: 20,
  },
});

export default ScrollPicker;
