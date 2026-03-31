import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import documentsReducer from '../features/documents/documentsSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import sharingReducer from '../features/sharing/sharingSlice';
import collaborationReducer from '../features/collaboration/collaborationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentsReducer,
    notifications: notificationsReducer,
    sharing: sharingReducer,
    collaboration: collaborationReducer,
  },
});

export default store;
