import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import * as XLSX from 'xlsx';
import { RotateCcw, Search } from 'lucide-react';
import { DataTable, DataTablePagination, DataTableWrapper } from '@/components/data-table';
import { DownloadExcelButton } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks';
import { billingService } from '../services';
import { StatusBadge } from './status-badge';
import { formatDateTime, formatPaise } from '@/utils/format-money';
import type { TPayment, TPaymentStatus, TPaymentType } from '../types';

type TTransactionsTableProps = {
  onSelect: (paymentId: string) => void;
  onRefund: (payment: TPayment) => void;
};

const STATUS_OPTIONS: Array<{ value: TPaymentStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'CAPTURED', label: 'Paid' },
  { value: 'PARTIALLY_REFUNDED', label: 'Partly refunded' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CREATED', label: 'Awaiting payment' },
  { value: 'EXPIRED', label: 'Expired' },
];

const TYPE_OPTIONS: Array<{ value: TPaymentType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All types' },
  { value: 'PRINT_JOB', label: 'Print jobs' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
];

export function TransactionsTable({ onSelect, onRefund }: TTransactionsTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<TPaymentStatus | 'ALL'>('ALL');
  const [type, setType] = useState<TPaymentType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const filters = useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(status !== 'ALL' ? { status } : {}),
      ...(type !== 'ALL' ? { type } : {}),
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
    }),
    [page, pageSize, status, type, debouncedSearch]
  );

  const { data, isLoading, isError, error } = billingService.useGetPayments(filters);
  const exportPayments = billingService.useExportPayments();

  const handleExport = () => {
    // Exports the whole filtered set, not just the page on screen.
    exportPayments.mutate(
      { ...filters, page: undefined, limit: undefined },
      {
        onSuccess: (rows) => {
          const sheet = XLSX.utils.json_to_sheet(
            rows.map((row) => ({
              Date: formatDateTime(row.createdAt),
              'Order ID': row.orderId ?? '',
              Type: row.paymentType,
              File: row.jobFilename ?? '',
              Pages: row.pageCount ?? '',
              Copies: row.copies ?? '',
              'Gross (₹)': row.amountPaise / 100,
              'Commission (₹)': row.commissionAmountPaise / 100,
              'Net (₹)': row.payoutAmountPaise / 100,
              'Refunded (₹)': row.refundedAmountPaise / 100,
              Status: row.status,
              Payout: row.payoutStatus,
            }))
          );
          const book = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(book, sheet, 'Transactions');
          XLSX.writeFile(book, `transactions-${new Date().toISOString().slice(0, 10)}.xlsx`);
        },
      }
    );
  };

  const columns = useMemo<ColumnDef<TPayment>[]>(
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
        accessorKey: 'jobFilename',
        header: 'Job',
        cell: ({ row }) => (
          <div className="flex max-w-[200px] flex-col">
            <span className="truncate text-sm font-medium">
              {row.original.jobFilename ??
                (row.original.paymentType === 'SUBSCRIPTION' ? 'Plan subscription' : '—')}
            </span>
            {row.original.pageCount ? (
              <span className="text-[11px] text-muted-foreground">
                {row.original.pageCount} pages × {row.original.copies ?? 1}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'amountPaise',
        header: () => <div className="text-right">Gross</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm tabular-nums">
            {formatPaise(row.original.amountPaise)}
          </div>
        ),
      },
      {
        accessorKey: 'commissionAmountPaise',
        header: () => <div className="text-right">Commission</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm text-muted-foreground tabular-nums">
            −{formatPaise(row.original.commissionAmountPaise)}
          </div>
        ),
      },
      {
        accessorKey: 'payoutAmountPaise',
        header: () => <div className="text-right">Net</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-semibold tabular-nums">
            {formatPaise(row.original.payoutAmountPaise - row.original.refundedAmountPaise)}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge kind="payment" value={row.original.status} />,
      },
      {
        accessorKey: 'payoutStatus',
        header: 'Payout',
        cell: ({ row }) => <StatusBadge kind="payout" value={row.original.payoutStatus} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const canRefund =
            row.original.status === 'CAPTURED' || row.original.status === 'PARTIALLY_REFUNDED';

          return (
            <div className="flex justify-end gap-1">
              {canRefund && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRefund(row.original);
                  }}
                >
                  <RotateCcw className="size-3.5" />
                  <span className="sr-only">Refund</span>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => onSelect(row.original.id)}>
                Details
              </Button>
            </div>
          );
        },
      },
    ],
    [onRefund, onSelect]
  );

  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by order id, payment id or file"
            className="h-9 pl-9"
          />
        </div>

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as TPaymentStatus | 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={type}
          onValueChange={(value) => {
            setType(value as TPaymentType | 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DownloadExcelButton isLoading={exportPayments.isPending} onClick={handleExport} />
      </div>

      <DataTableWrapper
        isLoading={isLoading}
        isError={isError}
        error={error as never}
        isEmpty={!isLoading && (data?.data.length ?? 0) === 0}
        emptyMessage="No payments match these filters yet."
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
    </div>
  );
}
