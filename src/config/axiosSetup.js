import axios from 'axios';
import api from './api';
import { store } from '../store';
import { showSubscriptionGate } from '../features/subscriptionGate/subscriptionGateSlice';

let refreshInFlight = null;

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('currentWorkspace');
};

const requestRefreshToken = async () => {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const storedRefreshToken = localStorage.getItem('refreshToken');
  if (!storedRefreshToken) {
    throw new Error('Missing refresh token');
  }

  refreshInFlight = axios
    .post(api.endpoints.auth.refreshToken(), { refreshToken: storedRefreshToken })
    .then((response) => {
      const newToken = response?.data?.token;
      const newRefreshToken = response?.data?.refreshToken;

      if (!newToken || !newRefreshToken) {
        throw new Error('Invalid refresh token response');
      }

      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      return newToken;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
};

const setupAxiosInterceptors = () => {
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error?.config;
      const status = error?.response?.status;
      const requestUrl = originalRequest?.url || '';

      if (
        status === 401
        && originalRequest
        && !originalRequest._retry
        && !requestUrl.includes('/auth/login')
        && !requestUrl.includes('/auth/register')
        && !requestUrl.includes('/auth/refresh-token')
      ) {
        originalRequest._retry = true;

        try {
          const newToken = await requestRefreshToken();
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch {
          clearSession();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }

      // `requireActiveSubscription` (backend middleware) returns 402 on any
      // protected route once a user's trial has expired with no active or
      // admin-approved subscription behind it. Surface one consistent modal
      // here rather than leaving each call site to render its own error
      // toast for what's actually a paywall, not a request failure — and
      // flag the error so call sites can skip a redundant toast of their own.
      if (status === 402) {
        const message = error?.response?.data?.message
          || 'Your trial has expired. Subscribe to a plan or contact an admin to restore access.';
        store.dispatch(showSubscriptionGate(message));
        error.subscriptionGateHandled = true;
      }

      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;