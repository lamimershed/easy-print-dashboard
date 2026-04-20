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

const EVENT_TYPE_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  scan: 'secondary',
  print_started: 'default',
  print_completed: 'default',
  print_failed: 'destructive',
};

export function AnalyticsEventsTable() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = analyticsService.useGetEvents(page, limit);

  if (isLoading)
    return <div className="py-8 text-center text-muted-foreground">Loading events…</div>;
  if (!data) return null;

  const totalPages = data.meta.totalPages;

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                No events yet
              </TableCell>
            </TableRow>
          ) : (
            data.data.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <Badge variant={EVENT_TYPE_COLORS[event.eventType] ?? 'secondary'}>
                    {event.eventType}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString()}
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
    </div>
  );
}
