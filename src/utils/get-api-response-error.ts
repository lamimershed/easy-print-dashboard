import { AxiosError } from 'axios';

type ApiErrorResponse = {
  message: string;
  error?:
    | string
    | {
        code?: string;
        message?: string;
        details?: string;
      };
  errors?: Record<string, string[]>;
};

export const getApiResponseError = (error: unknown): string => {
  // Handle axios errors with response data
  if (error instanceof AxiosError) {
    const response = error.response;
    const data = response?.data as ApiErrorResponse | undefined;

    // Check for nested error object first (more specific)
    if (data?.error && typeof data.error === 'object') {
      if (data.error.message) return data.error.message;
      if (data.error.details) return data.error.details;
    }

    // Check for error message in response data
    if (data?.message) return data.message;

    // Handle error as string
    if (data?.error && typeof data.error === 'string') {
      return data.error;
    }

    // Handle field validation errors
    if (data?.errors) {
      const firstErrorField = Object.keys(data.errors)[0];
      if (firstErrorField && data.errors[firstErrorField]?.length) {
        return data.errors[firstErrorField][0];
      }
    }

    // Handle common HTTP status codes
    if (response?.status) {
      switch (response.status) {
        case 400:
          return 'Bad request';
        case 401:
          return 'Unauthorized';
        case 403:
          return 'Forbidden';
        case 404:
          return 'Resource not found';
        case 409:
          return 'Conflict';
        case 422:
          return 'Validation error';
        case 429:
          return 'Too many requests';
        case 500:
          return 'Server error';
      }
    }

    // Handle axios error codes
    if (error.code === 'ERR_NETWORK') return 'Network error';
    if (error.code === 'ERR_BAD_REQUEST') return 'Bad request';
    if (error.message) return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') return error;

  // Handle errors with message property
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'Unknown error';
};
