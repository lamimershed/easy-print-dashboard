import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/services/type';

interface DataTablePaginationProps {
  pageData: Pagination;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
}

export function DataTablePagination({
  pageData,
  page,
  pageSize,
  setPage,
  setPageSize,
}: DataTablePaginationProps) {
  return (
    <div className="flex items-center justify-center px-2 py-3 sm:justify-end sm:py-4">
      <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-0 sm:space-x-6 lg:space-x-8">
        <div className="hidden items-center space-x-2 sm:flex">
          <p className="text-left text-sm font-medium">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              setPageSize(parseInt(value, 10));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Page info and navigation */}
        <div className="flex items-center gap-3 sm:gap-0 sm:space-x-6 lg:space-x-8">
          <div className="flex items-center text-sm font-medium">
            Page {pageData?.page} of {pageData?.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-10 w-10 p-0 sm:h-8 sm:w-8"
              onClick={() => (page > 1 ? setPage(page - 1) : null)}
              disabled={!pageData?.hasPrevPage}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="h-10 w-10 p-0 sm:h-8 sm:w-8"
              onClick={() => (page < pageData?.totalPages ? setPage(page + 1) : null)}
              disabled={!pageData?.hasNextPage}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
