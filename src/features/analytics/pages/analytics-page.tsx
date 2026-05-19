import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { analyticsService } from '../services';
import { AnalyticsSummaryGrid } from '../components/analytics-summary-grid';
import { AnalyticsEventsTable } from '../components/analytics-events-table';
import { PrintJobsTable } from '../components/print-jobs-table';
import { AnalyticsChart } from '../components/analytics-chart';
import type { TAnalyticsPeriod } from '../types';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<TAnalyticsPeriod>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: summary, isLoading } = analyticsService.useGetSummary(period);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: analyticsService.queryKeys.all });
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-full space-y-8 bg-primary/[0.02] p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="mb-3 h-1 w-10 rounded-full bg-primary" />
          <h1 className="text-3xl font-black tracking-tight text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track scans, print jobs, and customer activity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void handleRefresh();
            }}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>

          <Tabs value={period} onValueChange={(v) => setPeriod(v as TAnalyticsPeriod)}>
            <TabsList>
              <TabsTrigger value="7d">7 days</TabsTrigger>
              <TabsTrigger value="30d">30 days</TabsTrigger>
              <TabsTrigger value="all">All time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : summary ? (
        <AnalyticsSummaryGrid summary={summary} />
      ) : null}

      {summary && <AnalyticsChart summary={summary} period={period} />}

      <Separator />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Events</CardTitle>
            <CardDescription>QR scan and print lifecycle events</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsEventsTable />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Print Job History</CardTitle>
            <CardDescription>Submitted print jobs and their statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <PrintJobsTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
