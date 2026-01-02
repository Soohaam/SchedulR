import axios from 'axios';
import type { AppDispatch } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 8000, // fail fast on unreachable backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Store reference for dispatching actions (will be set by StoreProvider)
let storeDispatch: AppDispatch | null = null;

export const setApiStoreDispatch = (dispatch: AppDispatch) => {
  storeDispatch = dispatch;
};

// Add a response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't trigger automatic logout for authentication endpoints or booking creation
    // These endpoints are expected to return 401 for invalid credentials or allow guest access
    const authEndpoints = [
      '/api/v1/auth/login', 
      '/api/v1/auth/register', 
      '/api/v1/auth/verify-email', 
      '/api/v1/auth/2fa/verify',
      '/api/v1/customer/bookings/create'
    ];
    const isAuthEndpoint = authEndpoints.some(endpoint => originalRequest?.url?.includes(endpoint));

    // Handle 401 (Unauthorized) or 403 (Forbidden) errors for protected endpoints only
    if (error.response && (error.response.status === 401 || error.response.status === 403) && !isAuthEndpoint) {
      // Clear tokens
      localStorage.removeItem('token');
      localStorage.removeItem('sessionExpiry');

      // Dispatch logout action if store is available
      if (storeDispatch && typeof window !== 'undefined') {
        const { sessionExpired } = await import('./features/auth/authSlice');
        storeDispatch(sessionExpired());

        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
