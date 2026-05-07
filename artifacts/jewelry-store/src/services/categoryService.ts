import { apiFetch } from './api';
import type { Category } from '@/lib/api-hooks';

export const categoryService = {
  list: () => apiFetch<Category[]>('/categories'),
  create: (name: string) =>
    apiFetch<Category>('/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  remove: (id: string) => apiFetch<void>(`/categories/${id}`, { method: 'DELETE' }),
};
