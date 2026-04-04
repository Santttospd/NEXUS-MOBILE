import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// NEXUS-WEBSITE backend (porta 3000)
// Em emulador Android: http://10.0.2.2:3000
// Em dispositivo físico: http://SEU_IP_LOCAL:3000
const BASE_URL = 'http://192.168.100.15:3000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: injeta Bearer token automaticamente
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('nexus_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: trata respostas de erro globalmente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado — limpa o storage (AuthContext vai detectar)
      await SecureStore.deleteItemAsync('nexus_token');
      await SecureStore.deleteItemAsync('nexus_user');
    }
    return Promise.reject(error);
  }
);

export default api;
