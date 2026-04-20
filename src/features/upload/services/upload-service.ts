import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/services/api';
import { utils } from '@/utils';
import type { TApiResponse } from '@/services';

const usePreRegisterUpload = () =>
  useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<TApiResponse<{ url: string }>>(
        '/upload/logo/pre-register',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data.data;
    },
    onError: (error) => toast.error(utils.getApiResponseError(error) ?? 'Upload failed'),
  });

const useClientLogoUpload = () =>
  useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<TApiResponse<{ url: string }>>(
        '/upload/client-logo',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data.data;
    },
    onError: (error) => toast.error(utils.getApiResponseError(error) ?? 'Upload failed'),
  });

export const uploadService = { usePreRegisterUpload, useClientLogoUpload };
