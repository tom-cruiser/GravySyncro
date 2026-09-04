import { createSlice } from '@reduxjs/toolkit';

// Tracks the app-wide "trial expired / subscription inactive" paywall modal.
// Populated from the axios response interceptor (config/axiosSetup.js)
// whenever the backend returns a 402 from `requireActiveSubscription`
// (see gravysyncro-backend/src/middleware/subscriptionAccess.js), so every
// blocked action — document, audio, or video upload, wherever it happens —
// surfaces the same explanatory modal instead of a bare error toast.
const initialState = {
  isOpen: false,
  message: '',
};

const subscriptionGateSlice = createSlice({
  name: 'subscriptionGate',
  initialState,
  reducers: {
    showSubscriptionGate: (state, action) => {
      state.isOpen = true;
      state.message = action.payload || '';
    },
    hideSubscriptionGate: (state) => {
      state.isOpen = false;
    },
  },
});

export const { showSubscriptionGate, hideSubscriptionGate } = subscriptionGateSlice.actions;
export default subscriptionGateSlice.reducer;
