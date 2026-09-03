import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTablePagination, DataTableWrapper } from '@/components/data-table';
import { billingService } from '../services';
import { StatusBadge } from './status-badge';
import { formatDateTime, formatPaise } from '@/utils/format-money';
import type { TRefund } from '../types';

const REASON_LABEL: Record<string, string> = {
  CUSTOMER_REQUEST: 'Customer request',
  PRINT_FAILED: 'Print failed',
  PRINTER_OFFLINE: 'Printer offline',
  SESSION_EXPIRED: 'Session expired',
  DUPLICATE_CHARGE: 'Duplicate charge',
  QUALITY_ISSUE: 'Quality issue',
  FRAUD: 'Fraud',
  SUBSCRIPTION_CANCELLED: 'Plan cancelled',
  ADMIN_ADJUSTMENT: 'Admin adjustment',
};

const INITIATOR_LABEL: Record<string, string> = {
  SYSTEM: 'Automatic',
  CLIENT: 'You',
  ADMIN: 'Platform',
  CUSTOMER: 'Customer',
};

export function RefundsTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isError, error } = billingService.useGetRefunds(page, pageSize);

  const columns = useMemo<ColumnDef<TRefund>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-xs whitespace-nowrap text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: 'amountPaise',
        header: () => <div className="text-right">Refunded</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-semibold tabular-nums">
            {formatPaise(row.original.amountPaise)}
          </div>
        ),
      },
      {
        accessorKey: 'clientSharePaise',
        header: () => <div className="text-right">From your payout</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm text-muted-foreground tabular-nums">
            {formatPaise(row.original.clientSharePaise)}
          </div>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm">
              {REASON_LABEL[row.original.reason] ?? row.original.reason}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {INITIATOR_LABEL[row.original.initiator] ?? row.original.initiator}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <StatusBadge kind="refund" value={row.original.status} />
            {row.original.failureReason && (
              <span className="max-w-[180px] truncate text-[11px] text-destructive">
                {row.original.failureReason}
              </span>
            )}
          </div>
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
      emptyMessage="No refunds — nothing has needed one yet."
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
