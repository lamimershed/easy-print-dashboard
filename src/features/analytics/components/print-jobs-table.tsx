import { useState } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { analyticsService } from '../services';
import type { TPrintJob } from '../types';

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const STATUS_BADGE_CLASS: Record<TPrintJob['status'], string> = {
  COMPLETED: 'border-primary/40 bg-primary/10 text-primary font-semibold',
  PRINTING:
    'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  PENDING: 'border-muted-foreground/30 bg-muted text-muted-foreground',
  FAILED: 'border-destructive/40 bg-destructive/10 text-destructive',
};

const STATUS_LABELS: Record<TPrintJob['status'], string> = {
  COMPLETED: 'Completed',
  PRINTING: 'Printing',
  PENDING: 'Pending',
  FAILED: 'Failed',
};

export function PrintJobsTable() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<string | undefined>(undefined);

  const { data, isLoading } = analyticsService.useGetPrintJobs(page, limit, status);

  const handleStatusChange = (value: string) => {
    setStatus(value === 'all' ? undefined : value);
    setPage(1);
  };

  const handleLimitChange = (value: string) => {
    setLimit(Number(value));
    setPage(1);
  };

  const showingFrom = data && data.meta.total > 0 ? (page - 1) * limit + 1 : 0;
  const showingTo = data ? Math.min(page * limit, data.meta.total) : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status ?? 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger size="sm" className="w-[150px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PRINTING">Printing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows</span>
          <Select value={String(limit)} onValueChange={handleLimitChange}>
            <SelectTrigger size="sm" className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: limit > 10 ? 10 : limit }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : !data ? null : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Copies</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                      <Printer className="size-10 opacity-20" />
                      <p className="text-sm font-medium">No print jobs found</p>
                      <p className="text-xs opacity-60">
                        {status
                          ? `No ${status.toLowerCase()} jobs in this period`
                          : 'Print jobs will appear here when submitted'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((job) => {
                  const ext = job.filename.split('.').pop()?.toUpperCase();
                  return (
                    <TableRow key={job.id}>
                      <TableCell className="max-w-[180px]">
                        <div className="flex items-center gap-1.5 truncate">
                          {ext && (
                            <span className="shrink-0 rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {ext}
                            </span>
                          )}
                          <span className="truncate font-medium">{job.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatBytes(job.fileSize)}
                      </TableCell>
                      <TableCell>{job.copies}</TableCell>
                      <TableCell>{job.colorMode}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(STATUS_BADGE_CLASS[job.status])}>
                          {STATUS_LABELS[job.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(job.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {data.meta.total > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {showingFrom}–{showingTo} of {data.meta.total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.meta.hasPreviousPage}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.meta.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
