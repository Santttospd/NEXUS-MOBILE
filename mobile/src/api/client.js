import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// EXPO_PUBLIC_API_URL é injetado pelo Metro via .env (requer expo start --clear após mudanças)
// Fallback garante funcionamento mesmo se a variável não for injetada
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.16:3000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

let _onAuthFailure = null;
export function setOnAuthFailure(cb) {
  _onAuthFailure = cb;
}

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('nexus_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync('nexus_refresh_token');
      if (!refreshToken) throw new Error('no_refresh_token');

      const res = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
      const newToken = res.data.token;
      const newRefreshToken = res.data.refreshToken;

      await SecureStore.setItemAsync('nexus_token', newToken);
      if (newRefreshToken) {
        await SecureStore.setItemAsync('nexus_refresh_token', newRefreshToken);
      }
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      processQueue(null, newToken);
      return api(originalRequest);
    } catch (err) {
      processQueue(err, null);
      await SecureStore.deleteItemAsync('nexus_token');
      await SecureStore.deleteItemAsync('nexus_user');
      await SecureStore.deleteItemAsync('nexus_refresh_token');
      _onAuthFailure?.();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
