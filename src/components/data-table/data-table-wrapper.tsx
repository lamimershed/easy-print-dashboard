import React, { ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { utils } from '@/utils';

interface DataTableWrapperProps {
  isLoading?: boolean;
  isError: boolean;
  error?: AxiosError | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
}

export const DataTableWrapper: React.FC<DataTableWrapperProps> = ({
  isLoading,
  isError,
  error,
  isEmpty = false,
  emptyMessage = 'No data found',
  children,
}) => {
  if (isLoading) {
    return (
      <div className="mt-8 flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        <span className="ml-2 text-primary-foreground">Loading data...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-8 flex h-48 items-center justify-center rounded-md bg-red-50 p-4 text-red-500">
        <AlertCircle className="mr-2 h-6 w-6" />
        <div>
          <p className="font-medium">Error loading data</p>
          <p className="text-sm">{utils.getApiResponseError(error) || 'Please try again later'}</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="mt-8 rounded-md bg-gray-50 p-8 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
};
