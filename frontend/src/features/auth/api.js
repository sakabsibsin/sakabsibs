import { apiClient } from '@/lib/apiClient';

export const login = async (password) => { await apiClient.post('/auth/login', { password }); };
export const logout = async () => { await apiClient.post('/auth/logout'); };
export const fetchAuthStatus = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data.data;
};
export const fetchSettings = async () => { const { data } = await apiClient.get('/settings'); return data.data; };
export const updateSetting = async (key, value) => { await apiClient.put(`/settings/${key}`, { value }); };
