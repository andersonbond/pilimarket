/**
 * API client configuration
 */
import axios from 'axios';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Ensure headers object exists
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - let axios set it with boundary
    if (config.data instanceof FormData) {
      // Remove Content-Type to let axios set it with proper boundary
      if (config.headers) {
        delete (config.headers as any)['Content-Type'];
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/api/v1/auth/refresh`,
            { refresh_token: refreshToken }
          );
          
          if (response.data.success) {
            const { access_token } = response.data.data;
            localStorage.setItem('access_token', access_token);
            
            // Update headers with new token
            originalRequest.headers = originalRequest.headers || ({} as any);
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            
            // For FormData requests, make sure Content-Type is not set
            if (originalRequest.data instanceof FormData) {
              delete originalRequest.headers['Content-Type'];
            }
            
            // Retry the original request (FormData is reusable)
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

