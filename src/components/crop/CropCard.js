import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONT_SIZES, FONT_WEIGHTS } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS, SHADOWS, CARD } from '../../constants/layout';
import Badge from '../common/Badge';

const STATUS_COLORS = {
  growing: COLORS.success,
  harvested: COLORS.info,
  planted: COLORS.primaryLight,
  diseased: COLORS.danger,
  default: COLORS.textTertiary,
};

const CropCard = React.memo(({ crop, onPress }) => {
  const { name, imageUri, sowingDate, status, variety } = crop;
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.default;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialCommunityIcons
              name="sprout"
              size={36}
              color={COLORS.primaryLight}
            />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {variety && (
          <Text style={styles.variety} numberOfLines={1}>
            {variety}
          </Text>
        )}
        {sowingDate && (
          <Text style={styles.date}>
            Sown: {sowingDate}
          </Text>
        )}
        {status && (
          <Badge text={status} color={statusColor} />
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    height: 220,
    ...SHADOWS.md,
  },
  imageContainer: {
    height: 110,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.md,
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  variety: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  date: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginBottom: SPACING.xs,
  },
});

export default CropCard;
