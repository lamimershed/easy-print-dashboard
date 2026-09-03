import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTablePagination, DataTableWrapper } from '@/components/data-table';
import { billingService } from '../services';
import { StatusBadge } from './status-badge';
import { formatDateTime, formatPaise } from '@/utils/format-money';
import type { TPayout } from '../types';

export function PayoutsTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isError, error } = billingService.useGetPayouts(page, pageSize);

  const columns = useMemo<ColumnDef<TPayout>[]>(
    () => [
      {
        accessorKey: 'capturedAt',
        header: 'Paid on',
        cell: ({ row }) => (
          <span className="text-xs whitespace-nowrap text-muted-foreground">
            {formatDateTime(row.original.capturedAt ?? row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: 'amountPaise',
        header: () => <div className="text-right">Customer paid</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm text-muted-foreground tabular-nums">
            {formatPaise(row.original.amountPaise)}
          </div>
        ),
      },
      {
        accessorKey: 'payoutAmountPaise',
        header: () => <div className="text-right">Your share</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-semibold tabular-nums">
            {formatPaise(row.original.payoutAmountPaise)}
          </div>
        ),
      },
      {
        accessorKey: 'payoutStatus',
        header: 'Status',
        cell: ({ row }) => <StatusBadge kind="payout" value={row.original.payoutStatus} />,
      },
      {
        accessorKey: 'transferId',
        header: 'Transfer',
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-muted-foreground">
            {row.original.transferId ?? '—'}
          </span>
        ),
      },
    ],
    []
  );

  const meta = data?.meta;

  return (
    <DataTableWrapper
      isLoading={isLoading}
      isError={isError}
      error={error as never}
      isEmpty={!isLoading && (data?.data.length ?? 0) === 0}
      emptyMessage="No payouts yet. They appear here once a customer pays you."
    >
      <DataTable data={data?.data ?? []} columns={columns} pageSize={pageSize} />
      {meta && (
        <DataTablePagination
          pageData={{
            totalDocs: meta.total,
            limit: meta.perPage,
            totalPages: meta.totalPages,
            page: meta.currentPage,
            pagingCounter: 1,
            hasPrevPage: meta.hasPreviousPage,
            hasNextPage: meta.hasNextPage,
            prevPage: meta.hasPreviousPage ? meta.currentPage - 1 : null,
            nextPage: meta.hasNextPage ? meta.currentPage + 1 : null,
          }}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      )}
    </DataTableWrapper>
  );
}
