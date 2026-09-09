import axios from 'axios';

export const getApiBaseUrl = () => {
  // 1. Explicit Vite environment variables
  if (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim()) {
    return import.meta.env.VITE_API_BASE_URL.trim().replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) {
    return import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '');
  }
  // 2. Runtime window environment if configured
  if (typeof window !== 'undefined' && window.__ENV__?.VITE_API_BASE_URL) {
    return window.__ENV__.VITE_API_BASE_URL.trim().replace(/\/+$/, '');
  }
  // 3. Fallback when developing locally in browser
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8080/api/v1';
  }
  // 4. Remote / cloud deployment fallback
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/api/v1`;
  }
  return 'http://localhost:8080/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally and normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Normalize backend error message variations
    if (error.response && error.response.data) {
      const data = error.response.data;
      // If we don't have a explicit message but we have a detail (ProblemDetail / FastAPI)
      if (!data.message && data.detail) {
        if (typeof data.detail === 'string') {
          data.message = data.detail;
        } else if (Array.isArray(data.detail)) {
          // FastAPI validation array
          data.message = data.detail.map(d => d.msg || d.type).join(', ');
        }
      }
    }

    // 2. Handle unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
