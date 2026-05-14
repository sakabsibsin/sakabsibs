import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Prevent browser HTTP cache from serving stale data after mutations.
// The backend sends Cache-Control: max-age=300 on GET routes, which causes
// React Query refetches to receive the old cached response instead of fresh data.
apiClient.interceptors.request.use((config) => {
  if (config.method === 'get') {
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const isAdminPage =
      window.location.pathname.startsWith('/admin') &&
      !window.location.pathname.includes('/login');

    // Only hard-redirect on 401 when the user is on a protected admin page
    if (status === 401 && isAdminPage) {
      window.location.href = '/admin/login';
    }

    // For all other 401s (e.g. auth-status check from store Navbar),
    // just reject silently — callers opt-in to error handling
    return Promise.reject(error);
  }
);
