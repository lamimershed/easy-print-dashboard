import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsService } from '../services';
import { AnalyticsSummaryGrid } from '../components/analytics-summary-grid';
import { AnalyticsEventsTable } from '../components/analytics-events-table';
import { PrintJobsTable } from '../components/print-jobs-table';
import type { TAnalyticsPeriod } from '../types';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<TAnalyticsPeriod>('30d');
  const { data: summary, isLoading } = analyticsService.useGetSummary(period);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Track scans and print activity</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as TAnalyticsPeriod)}>
          <TabsList>
            <TabsTrigger value="7d">7 days</TabsTrigger>
            <TabsTrigger value="30d">30 days</TabsTrigger>
            <TabsTrigger value="all">All time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : summary ? (
        <AnalyticsSummaryGrid summary={summary} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsEventsTable />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Print Job History</CardTitle>
          </CardHeader>
          <CardContent>
            <PrintJobsTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
