import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'smartkisan_notifications';

export const saveNotifications = async (notifications) => {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(notifications)
  );
};

export const getNotifications = async () => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);

  return data ? JSON.parse(data) : [];
};
