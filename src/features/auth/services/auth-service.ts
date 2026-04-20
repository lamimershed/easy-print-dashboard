import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import api from '@/services/api';
import { useAuthStore } from '@/stores';
import { utils } from '@/utils';
import { authRoutes, DEFAULT_ROUTE } from '../config';
import type { TRoleValue } from '../config';
import type { TAuthResponse, TLoginRequest, TRegisterRequest } from '../types';

const queryKeys = {
  all: ['auth'] as const,
  me: () => ['auth', 'me'] as const,
};

const useLogin = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: TLoginRequest) => {
      const { data } = await api.post<TAuthResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user.role);
      navigate(DEFAULT_ROUTE[data.user.role as TRoleValue] ?? '/dashboard');
    },
    onError: (error) => {
      toast.error(utils.getApiResponseError(error) ?? 'Login failed. Please try again.');
    },
  });
};

const useRegister = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (payload: TRegisterRequest) => {
      const { data } = await api.post<TAuthResponse>('/auth/register', payload);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user.role);
      navigate(DEFAULT_ROUTE[data.user.role as TRoleValue] ?? '/dashboard');
    },
    onError: (error) => {
      toast.error(utils.getApiResponseError(error) ?? 'Registration failed. Please try again.');
    },
  });
};

const useLogout = () => {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      navigate(authRoutes.items.login.href);
      toast.success('Logged out successfully.');
    },
    onError: (error) => {
      console.error('Logout failed', error);
      clearAuth();
      queryClient.clear();
      navigate(authRoutes.items.login.href);
    },
  });
};

const useGetMe = () =>
  useQuery({
    queryKey: queryKeys.me(),
    queryFn: async () => {
      const { data } = await api.get<TAuthResponse['user']>('/auth/me');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const authService = {
  queryKeys,
  useLogin,
  useRegister,
  useLogout,
  useGetMe,
};
