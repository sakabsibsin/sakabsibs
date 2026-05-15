import { apiClient } from '@/lib/apiClient';

export const fetchCategories = async () => { const { data } = await apiClient.get('/categories'); return data.data; };
export const createCategory = async (body) => { const { data } = await apiClient.post('/categories', body); return data.data; };
export const updateCategory = (id, body) =>
  apiClient.put(`/categories/${id}`, body).then((r) => r.data.data);
export const deleteCategory = async (id) => { await apiClient.delete(`/categories/${id}`); };
