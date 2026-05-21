import { apiClient, setToken, removeToken } from '@/lib/apiClient';

export const login = async (password) => {
  const { data } = await apiClient.post('/auth/login', { password });
  setToken(data.data.token);
};

export const logout = async () => {
  removeToken();
};

export const fetchAuthStatus = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data.data;
};

export const fetchSettings  = async () => { const { data } = await apiClient.get('/settings'); return data.data; };
export const updateSetting  = async (key, value) => {
  const { data } = await apiClient.put(`/settings/${key}`, { value });
  return data.data; // backend returns { success: true, data: {...} }
};
