import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Session expiration event listeners
type SessionExpiredCallback = () => void;
const sessionExpiredListeners = new Set<SessionExpiredCallback>();

export const onSessionExpired = (callback: SessionExpiredCallback): (() => void) => {
  sessionExpiredListeners.add(callback);
  return () => sessionExpiredListeners.delete(callback);
};

const notifySessionExpired = (): void => {
  sessionExpiredListeners.forEach(callback => callback());
};

// Auto-detect API URL from Expo's dev server (no cache issues)
const getApiUrl = (): string => {
  if (__DEV__) {
    // In dev: always auto-detect from Expo debugger host
    const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      return `http://${ip}:8000`;
    }
  }
  // Production or fallback: use env or localhost
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
};

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const setTokens = async (accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('refreshToken', refreshToken);
};

export const getAccessToken = async () => {
  return await SecureStore.getItemAsync('accessToken');
};

export const getRefreshToken = async () => {
  return await SecureStore.getItemAsync('refreshToken');
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
};

// Request interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          await setTokens(accessToken, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        await clearTokens();
        // Notify listeners that session has expired
        notifySessionExpired();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
