import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/services/api';
import { utils } from '@/utils';
import { useAuthStore } from '@/stores';
import type { TClientProfile, TUpdateClientRequest } from '../types';

const queryKeys = {
  all: ['client'] as const,
  me: () => ['client', 'me'] as const,
};

const useGetMe = () =>
  useQuery({
    queryKey: queryKeys.me(),
    queryFn: async () => {
      const { data } = await api.get<TClientProfile>('/clients/me');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

const useUpdateMe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TUpdateClientRequest) => {
      const { data } = await api.patch<TClientProfile>('/clients/me', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      toast.success('Profile updated');
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

const useDeleteMe = () => {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete('/clients/me');
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      window.location.href = '/auth/login';
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

export const profileService = { queryKeys, useGetMe, useUpdateMe, useDeleteMe };
