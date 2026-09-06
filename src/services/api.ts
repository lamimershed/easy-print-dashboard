import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth-store';
import { API_BASE_URL } from '@/config/api-base-url';

const BASE_URL = API_BASE_URL;

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise: Promise<string> | null = null;

/**
 * Exchanges the refresh cookie for a new access token and stores it.
 *
 * Single-flight: concurrent callers share one in-flight request, so a 401 storm
 * (or the socket and an API call racing) issues exactly one /auth/refresh.
 * Exported because the WebSocket needs the same refresh — its handshake token is
 * frozen for the life of the connection, so an expired one can only be fixed by
 * refreshing and reconnecting.
 */
export const refreshAccessToken = (): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = axios
    .post<{ success: boolean; data: { accessToken: string } }>(
      `${BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true, headers: { 'ngrok-skip-browser-warning': 'true' } }
    )
    .then((response) => {
      const { accessToken } = response.data.data;
      useAuthStore.getState().updateAccessToken(accessToken);
      return accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { clearAuth, isAuthenticated } = useAuthStore.getState();

      if (!isAuthenticated) {
        clearAuth();
        return Promise.reject(error);
      }

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAuth();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
