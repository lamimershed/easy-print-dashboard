export type TApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

export type TApiErrorResponse = {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
};

export type TMeta = {
  total: number;
  currentPage: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type TApiPaginatedResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  meta: TMeta;
  timestamp: string;
};

export type TPaginatedResult<T> = {
  data: T[];
  meta: TMeta;
};

export type Pagination = {
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
};
