import { useState } from 'react';
import { Activity } from 'lucide-react';
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

const EVENT_TYPE_BADGE_CLASS: Record<string, string> = {
  scan: 'border-primary/20 bg-primary/5 text-primary/80',
  print_started: 'border-muted-foreground/20 bg-muted text-muted-foreground',
  print_completed: 'border-primary/40 bg-primary/10 text-primary font-semibold',
  print_failed: 'border-destructive/40 bg-destructive/10 text-destructive',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  scan: 'Scan',
  print_started: 'Print Started',
  print_completed: 'Print Completed',
  print_failed: 'Print Failed',
};

export function AnalyticsEventsTable() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [eventType, setEventType] = useState<string | undefined>(undefined);

  const { data, isLoading } = analyticsService.useGetEvents(page, limit, eventType);

  const handleEventTypeChange = (value: string) => {
    setEventType(value === 'all' ? undefined : value);
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
        <Select value={eventType ?? 'all'} onValueChange={handleEventTypeChange}>
          <SelectTrigger size="sm" className="w-[160px]">
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            <SelectItem value="scan">Scan</SelectItem>
            <SelectItem value="print_started">Print Started</SelectItem>
            <SelectItem value="print_completed">Print Completed</SelectItem>
            <SelectItem value="print_failed">Print Failed</SelectItem>
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
                <TableHead>Event</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2}>
                    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                      <Activity className="size-10 opacity-20" />
                      <p className="text-sm font-medium">No events found</p>
                      <p className="text-xs opacity-60">
                        {eventType
                          ? `No "${EVENT_TYPE_LABELS[eventType] ?? eventType}" events in this period`
                          : 'Activity will appear here once users interact'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(EVENT_TYPE_BADGE_CLASS[event.eventType])}
                      >
                        {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
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
