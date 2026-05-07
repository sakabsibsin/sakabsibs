import { apiFetch } from './api';

export const settingsService = {
  list: () => apiFetch<Record<string, string>>('/settings'),
  upsert: (key: string, value: string) =>
    apiFetch<{ key: string; value: string }>(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),
};
