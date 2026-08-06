import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,

  reducers: {
    setNotifications(state, action) {
      state.notifications = action.payload;

      state.unreadCount = action.payload.filter(
        item => !item.read
      ).length;
    },

    addNotification(state, action) {
      state.notifications.unshift(action.payload);

      state.unreadCount = state.notifications.filter(
        item => !item.read
      ).length;
    },

    markRead(state, action) {
      const notification = state.notifications.find(
        item => item.id === action.payload
      );

      if (notification) {
        notification.read = true;
      }

      state.unreadCount = state.notifications.filter(
        item => !item.read
      ).length;
    },

    markAllRead(state) {
      state.notifications = state.notifications.map(
        item => ({
          ...item,
          read: true,
        })
      );

      state.unreadCount = 0;
    },

    clearNotifications(state) {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markRead,
  markAllRead,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
