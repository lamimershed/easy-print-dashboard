import { useMutation, useQuery } from '@tanstack/react-query';

import api from '@/services/api';
import type {
  TBulkUploadResponse,
  TFileBulkUploadRequest,
  TFileUploadRequest,
  TFileUploadResponse,
  TPresignedUploadResponse,
  TRoleItem,
} from '@/types/common-services-types';

const useGetRoles = () => {
  return useQuery({
    queryKey: ['role'],
    queryFn: async () => {
      const { data } = await api.get<TRoleItem[]>('/master-data/role');
      return data?.map((item: TRoleItem) => ({
        label: item.name,
        value: item.value,
      }));
    },
    staleTime: 1000 * 60 * 10,
  });
};

const useGetPresignedUploadUrl = () => {
  return useMutation({
    mutationFn: async (fileUploadRequest: TFileUploadRequest) => {
      const { data } = await api.post<TPresignedUploadResponse>(
        '/file/presign-upload',
        fileUploadRequest
      );
      return data;
    },
  });
};

const useGetBulkPresignedUploadUrl = () => {
  return useMutation({
    mutationFn: async (fileUploadRequest: TFileBulkUploadRequest[]) => {
      const { data } = await api.post<TBulkUploadResponse>(
        '/file/bulk-presign-upload',
        fileUploadRequest
      );
      return data;
    },
  });
};

const useUploadImage = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await api.post<TFileUploadResponse>('/files/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
  });
};

export const commonService = {
  useGetRoles,
  useGetPresignedUploadUrl,
  useGetBulkPresignedUploadUrl,
  useUploadImage,
};
