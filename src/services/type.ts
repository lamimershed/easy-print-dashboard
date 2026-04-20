export interface ApiResponse<T> {
  success: boolean;
  data: T;
  msg?: string;
  code: string;
  error?: string;
  serverTime: string;
}

export interface ApiResponseErrorResponse {
  success: false;
  data: null;
  message: string;
  statusCode: number;
  error: string;
}

export interface Pagination {
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface PaginatedData<T> {
  docs: T;
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export type ApiPaginationResponse<T> = ApiResponse<PaginatedData<T>>;
