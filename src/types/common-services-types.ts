import { ApiResponse } from '@/services/type';

// Role types
export type TRoleList = 'admin' | 'warehouse' | 'customer';

export interface TRoleItem {
  name: string;
  value: TRoleList;
}

export type TRoleListResponse = ApiResponse<TRoleItem[]>;

// File upload key types
export type TFileUploadKey = 'categories' | 'products' | 'brands' | 'warehouses' | 'others';

// Image mime types
export type TImageMimeType =
  | 'image/png'
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/webp'
  | 'image/svg+xml';

// File upload types
export interface TFileUploadRequest {
  key: TFileUploadKey;
  mimetype: TImageMimeType;
}

export type TPresignedUploadResponse = ApiResponse<{ uploadUrl: string; filePath: string }>;

// File upload bulk types
export interface TFileBulkUploadRequest {
  key: TFileUploadKey;
  mimetype: TImageMimeType;
  fileName: string;
}

export interface TBulkUploadItem {
  uploadUrl: string;
  filePath: string;
  originalFileName: string;
}

export interface TBulkUploadResponseData {
  success: TBulkUploadItem[];
  failed: TBulkUploadItem[];
}

export type TFileUploadResponse = ApiResponse<{
  name: string;
  fileName: string;
  fileId: string;
  location: string;
}>;

export type TBulkUploadResponse = ApiResponse<TBulkUploadResponseData>;
