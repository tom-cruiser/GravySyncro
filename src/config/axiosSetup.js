import axios from 'axios';
import api from './api';

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

      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;