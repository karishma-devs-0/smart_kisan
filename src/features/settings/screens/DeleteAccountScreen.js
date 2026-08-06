import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';

import { useDispatch } from 'react-redux';

import ScreenLayout from '../../../components/common/ScreenLayout';

import { logout } from '../../auth/slice/authSlice';

import { userAPI } from '../../../services/backendApi';

const DeleteAccountScreen = ({ navigation }) => {

    const dispatch = useDispatch();

    const [loading, setLoading] = useState(false);

    // ======================================================
    // DELETE ACCOUNT
    // ======================================================

    const deleteAccount = async () => {

        try {

            setLoading(true);

            const data = await userAPI.deleteAccount();

            Alert.alert(
                'Account Deleted',
                'Your account has been deleted successfully.'
            );

            // LOGOUT USER
            dispatch(logout());

        } catch (error) {

            Alert.alert(
                'Error',
                error.message || 'Something went wrong'
            );

        } finally {

            setLoading(false);

        }
    };

    // ======================================================
    // CONFIRM POPUP
    // ======================================================

    const confirmDelete = () => {

        Alert.alert(
            'Delete Account',
            'Are you sure you want to permanently delete your account?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },

                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: deleteAccount,
                },
            ]
        );
    };

    return (
        <ScreenLayout
            title="Delete Account"
            showBack
            onBack={() => navigation.goBack()}
            scrollable={true}
        >

            <View style={styles.container}>

                <Text style={styles.title}>
                    Delete Smart Kisan Account
                </Text>

                <Text style={styles.description}>
                    This action will permanently delete your Smart Kisan account and associated data.
                </Text>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={confirmDelete}
                    disabled={loading}
                >

                    {
                        loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.deleteButtonText}>
                                Delete Account
                            </Text>
                        )
                    }

                </TouchableOpacity>

            </View>

        </ScreenLayout>
    );
};

const styles = StyleSheet.create({

    container: {
        padding: 20,
    },

    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
    },

    description: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 30,
    },

    deleteButton: {
        backgroundColor: 'red',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },

    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default DeleteAccountScreen;
