import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const getBaseUrl = (): string => {
  let url = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || '/api';
  // Si es una URL completa remota (ej: https://...execute-api.us-east-1.amazonaws.com) y no termina en /api
  if (url.startsWith('http') && !url.endsWith('/api') && !url.includes('/api/')) {
    url = `${url.replace(/\/+$/, '')}/api`;
  }
  return url;
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de Petición: Inyecta el token Bearer si existe en localStorage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('sgaob_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Interceptor de Respuesta: Maneja errores globales de autenticación (401) y permisos (403)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido: limpiar sesión local
      localStorage.removeItem('sgaob_token');
      // Si no estamos en la página de login, redirigir
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
