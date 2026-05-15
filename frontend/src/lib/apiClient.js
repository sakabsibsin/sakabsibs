import axios from 'axios';

const TOKEN_KEY = 'sakabsibs_token';

export const getToken  = ()        => localStorage.getItem(TOKEN_KEY);
export const setToken  = (token)   => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = ()      => localStorage.removeItem(TOKEN_KEY);

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token on every outgoing request
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  // Bypass browser HTTP cache for GET requests so mutations reflect immediately
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

    if (status === 401 && isAdminPage) {
      removeToken();
      window.location.href = '/admin/login';
    }

    return Promise.reject(error);
  }
);
