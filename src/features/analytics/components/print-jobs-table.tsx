import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { analyticsService } from '../services';

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  COMPLETED: 'default',
  PRINTING: 'secondary',
  PENDING: 'secondary',
  FAILED: 'destructive',
};

export function PrintJobsTable() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = analyticsService.useGetPrintJobs(page, limit);

  if (isLoading)
    return <div className="py-8 text-center text-muted-foreground">Loading print jobs…</div>;
  if (!data) return null;

  const totalPages = Math.ceil(data.total / limit);

  return (
    <div className="space-y-3">
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
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No print jobs yet
              </TableCell>
            </TableRow>
          ) : (
            data.data.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="max-w-[200px] truncate font-medium">{job.filename}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatBytes(job.fileSize)}
                </TableCell>
                <TableCell>{job.copies}</TableCell>
                <TableCell>{job.colorMode}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[job.status] ?? 'secondary'}>{job.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(job.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
