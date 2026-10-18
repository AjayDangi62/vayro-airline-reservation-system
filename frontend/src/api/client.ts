import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vayro_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string>; error?: string }>) => {
    if (error.response?.status === 401) {
      // If unauthorized, clear saved token
      // Avoid redirecting if already on login/register page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('vayro_token');
        localStorage.removeItem('vayro_user');
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { message?: string; error?: string; errors?: Record<string, string> };
    if (data.message) {
      return data.message;
    }
    if (data.errors && typeof data.errors === 'object') {
      const fieldErrors = Object.values(data.errors).join(', ');
      if (fieldErrors) return fieldErrors;
    }
    if (data.error) {
      return data.error;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
