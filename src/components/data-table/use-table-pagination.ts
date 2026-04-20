import { useState } from 'react';
import type { Pagination } from '@/services/type';

type ApiPageData = {
  count?: number;
  pages?: number;
};

export const useTablePagination = (defaultPageSize = 10) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const buildPageData = (data: ApiPageData | undefined): Pagination => ({
    totalDocs: data?.count ?? 0,
    totalPages: data?.pages ?? 0,
    page,
    limit: pageSize,
    hasPrevPage: page > 1,
    hasNextPage: page < (data?.pages ?? 0),
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < (data?.pages ?? 0) ? page + 1 : null,
    pagingCounter: (page - 1) * pageSize + 1,
  });

  return { page, setPage, pageSize, setPageSize, buildPageData };
};
