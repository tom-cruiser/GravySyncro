import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  inbox: [],
  toasts: [],
  unreadCount: 0,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const toast = {
        id: action.payload.id || Date.now(),
        type: action.payload.type || 'info',
        message: action.payload.message || '',
        timestamp: action.payload.timestamp || new Date().toISOString(),
      };
      state.toasts = [toast, ...state.toasts].slice(0, 6);
    },
    dismissToast: (state, action) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    markAsRead: (state, action) => {
      const notification = state.inbox.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.inbox.forEach(n => n.read = true);
      state.unreadCount = 0;
    },
    deleteNotification: (state, action) => {
      const notification = state.inbox.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.inbox = state.inbox.filter(n => n.id !== action.payload);
    },
    setNotifications: (state, action) => {
      state.inbox = action.payload;
      state.unreadCount = action.payload.filter(n => !n.read).length;
    },
    prependNotification: (state, action) => {
      const notification = action.payload;
      state.inbox = [notification, ...state.inbox.filter((item) => item.id !== notification.id)].slice(0, 50);
      if (!notification.read) {
        state.unreadCount += 1;
      }
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = Math.max(0, Number(action.payload) || 0);
    },
  },
});

export const {
  addNotification,
  dismissToast,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  setNotifications,
  prependNotification,
  setUnreadCount,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
