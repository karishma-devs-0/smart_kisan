import React from 'react';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants/colors';
import { SPACING } from '../../../constants/spacing';
import {
    FONT_SIZES,
    FONT_WEIGHTS,
} from '../../../constants/typography';

const NotificationDetailScreen = ({
    navigation,
    route,
}) => {

    const insets = useSafeAreaInsets();

    const notification =
        route.params?.notification;

    if (!notification) {
        return (
            <View style={styles.center}>
                <Text>No notification found</Text>
            </View>
        );
    }

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
                    Notification
                </Text>

                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={
                    styles.content
                }
            >
                <View style={styles.card}>
                    <Text style={styles.title}>
                        {notification.title}
                    </Text>

                    <Text style={styles.time}>
                        {notification.time}
                    </Text>

                    <View style={styles.divider} />

                    <Text style={styles.message}>
                        {notification.description || notification.message}
                    </Text>

                    {notification.type && (
                        <>
                            <View style={styles.divider} />

                            <Text style={styles.type}>
                                Type: {notification.type}
                            </Text>
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default NotificationDetailScreen;

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
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.textPrimary,
    },

    content: {
        padding: SPACING.lg,
    },

    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
    },

    title: {
        fontSize: 24,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.textPrimary,
    },

    time: {
        marginTop: 10,
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },

    divider: {
        height: 1,
        backgroundColor: '#EFEFEF',
        marginVertical: 20,
    },

    message: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textPrimary,
        lineHeight: 26,
    },

    type: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.primary,
        fontWeight: FONT_WEIGHTS.medium,
    },

    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
