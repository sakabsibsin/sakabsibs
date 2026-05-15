import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getToken } from '@/lib/apiClient';
import * as api from './api';

const settingsKey = ['settings'];
const authKey    = ['auth-status'];

/** Checks if the current session is authenticated.
 *  Skips the network call entirely when no token is in localStorage.
 *  Returns { authenticated: true } or undefined when not logged in. */
export const useAuthStatus = () =>
  useQuery({
    queryKey: authKey,
    queryFn: api.fetchAuthStatus,
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
    enabled: !!getToken(),
  });

export const useSettings = () =>
  useQuery({ queryKey: settingsKey, queryFn: api.fetchSettings, staleTime: 5 * 60 * 1000 });

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.login,
    onSuccess: () => {
      // Token is now in localStorage — tell React Query to re-check auth status
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
