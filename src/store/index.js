import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import documentsReducer from '../features/documents/documentsSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import sharingReducer from '../features/sharing/sharingSlice';
import collaborationReducer from '../features/collaboration/collaborationSlice';
import workspaceReducer from '../features/workspace/workspaceSlice';
import subscriptionGateReducer from '../features/subscriptionGate/subscriptionGateSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentsReducer,
    notifications: notificationsReducer,
    sharing: sharingReducer,
    collaboration: collaborationReducer,
    workspace: workspaceReducer,
    subscriptionGate: subscriptionGateReducer,
  },
});

export default store;
