import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as api from './api';

const settingsKey = ['settings'];
const authKey = ['auth-status'];

/** Silently checks if the current session is authenticated.
 *  Returns { authenticated: true } or null if not logged in.
 *  Does NOT redirect — safe to call from user-facing pages. */
export const useAuthStatus = () =>
  useQuery({
    queryKey: authKey,
    queryFn: api.fetchAuthStatus,
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
    // Suppress 401 errors — not-logged-in is a valid state for store pages
    meta: { suppressError: true },
  });

export const useSettings = () =>
  useQuery({ queryKey: settingsKey, queryFn: api.fetchSettings, staleTime: 5 * 60 * 1000 });

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.login,
    onSuccess: () => {
      // Invalidate auth status so Navbar updates immediately
      qc.invalidateQueries({ queryKey: authKey });
    },
  });
};

export const useLogout = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      qc.clear();
      navigate('/admin/login');
    },
  });
};

export const useUpdateSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }) => api.updateSetting(key, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKey }),
  });
};
