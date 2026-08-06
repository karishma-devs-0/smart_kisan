import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import {
  useDispatch,
  useSelector,
} from 'react-redux';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  markRead,
  markAllRead,
} from '../slice/notificationSlice';

import { COLORS } from '../../../constants/colors';
import { SPACING } from '../../../constants/spacing';
import {
  FONT_SIZES,
  FONT_WEIGHTS,
} from '../../../constants/typography';
import { BORDER_RADIUS } from '../../../constants/layout';

const NotificationScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const notifications = useSelector(
    state => state.notifications.notifications
  );

  const [refreshing, setRefreshing] =
    React.useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'pump':
        return 'water-pump';

      case 'weather':
        return 'weather-lightning-rainy';

      case 'soil':
        return 'leaf';

      case 'irrigation_reminder':
        return 'bell-ring';

      case 'price_alert':
        return 'currency-inr';

      default:
        return 'bell';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'pump':
        return COLORS.primary;

      case 'weather':
        return COLORS.info;

      case 'soil':
        return COLORS.warning;

      case 'irrigation_reminder':
        return COLORS.success;

      case 'price_alert':
        return '#9C27B0';

      default:
        return COLORS.textSecondary;
    }
  };

  const handleNotificationPress = (item) => {

    dispatch(markRead(item.id));

    navigation.navigate(
      'NotificationDetail',
      {
        notification: item,
      }
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => handleNotificationPress(item)}
      style={[
        styles.notificationCard,
        !item.read && styles.unreadCard,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor:
              `${getColor(item.type)}20`,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={getIcon(item.type)}
          size={24}
          color={getColor(item.type)}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.title}>
            {item.title}
          </Text>

          {!item.read && (
            <View style={styles.unreadDot} />
          )}
        </View>

        <Text style={styles.message}>
          {item.message}
        </Text>

        <Text style={styles.time}>
          {item.time}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 20,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Notifications
        </Text>

        <TouchableOpacity
          onPress={() =>
            dispatch(markAllRead())
          }
        >
          <MaterialCommunityIcons
            name="check-all"
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          padding: SPACING.lg,
          paddingBottom: 120,
          flexGrow:
            notifications.length === 0
              ? 1
              : undefined,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={72}
              color={COLORS.textTertiary}
            />

            <Text style={styles.emptyTitle}>
              No Notifications
            </Text>

            <Text style={styles.emptyText}>
              You're all caught up.
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,

    backgroundColor: COLORS.white,

    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  headerTitle: {
    flex: 1,
    marginLeft: SPACING.xl,

    fontSize: 22,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },

  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.white,

    borderRadius: BORDER_RADIUS.lg,

    padding: SPACING.md,

    marginBottom: SPACING.md,

    elevation: 2,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },

  iconContainer: {
    width: 52,
    height: 52,

    borderRadius: 26,

    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    marginLeft: SPACING.md,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  title: {
    flex: 1,

    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,

    color: COLORS.textPrimary,
  },

  message: {
    marginTop: 4,

    color: COLORS.textSecondary,

    fontSize: FONT_SIZES.sm,
  },

  time: {
    marginTop: 6,

    fontSize: FONT_SIZES.xs,

    color: COLORS.textTertiary,
  },

  unreadDot: {
    width: 10,
    height: 10,

    borderRadius: 5,

    backgroundColor: COLORS.primary,

    marginLeft: 8,
    marginTop: 5,
  },

  emptyContainer: {
    flex: 1,

    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTitle: {
    marginTop: 16,

    fontSize: FONT_SIZES.lg,

    fontWeight: FONT_WEIGHTS.bold,

    color: COLORS.textPrimary,
  },

  emptyText: {
    marginTop: 8,

    color: COLORS.textSecondary,
  },
});