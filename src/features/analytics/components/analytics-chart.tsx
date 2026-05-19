import { PieChart, Pie, Cell } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import type { TAnalyticsSummary, TAnalyticsPeriod } from '../types';

interface AnalyticsChartProps {
  summary: TAnalyticsSummary;
  period: TAnalyticsPeriod;
}

const PERIOD_LABELS: Record<TAnalyticsPeriod, string> = {
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  all: 'all time',
};

const chartConfig = {
  completed: { label: 'Completed', color: 'var(--chart-2)' },
  failed: { label: 'Failed', color: 'var(--chart-5)' },
  inProgress: { label: 'In Progress', color: 'var(--chart-4)' },
  totalScans: { label: 'Total Scans', color: 'var(--chart-1)' },
} satisfies ChartConfig;

export function AnalyticsChart({ summary, period }: AnalyticsChartProps) {
  const pendingJobs = Math.max(
    0,
    summary.totalPrintJobs - summary.completedPrintJobs - summary.failedPrintJobs
  );

  const rawData = [
    { name: 'Completed', value: summary.completedPrintJobs, colorVar: 'var(--chart-2)' },
    { name: 'Failed', value: summary.failedPrintJobs, colorVar: 'var(--chart-5)' },
    { name: 'In Progress', value: pendingJobs, colorVar: 'var(--chart-4)' },
    { name: 'Total Scans', value: summary.totalScans, colorVar: 'var(--chart-1)' },
  ];

  const filteredData = rawData.filter((d) => d.value > 0);
  const totalValue = filteredData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Activity Breakdown</CardTitle>
          <p className="text-xs text-muted-foreground">Based on {PERIOD_LABELS[period]}</p>
        </div>
      </CardHeader>
      <CardContent>
        {summary.totalPrintJobs === 0 && summary.totalScans === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-muted-foreground">
            <PieChartIcon className="size-12 opacity-20" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div className="relative h-[200px] w-full max-w-[200px] shrink-0">
              <ChartContainer config={chartConfig} className="h-full">
                <PieChart>
                  <Pie
                    data={filteredData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {filteredData.map((item, index) => (
                      <Cell key={index} fill={item.colorVar} stroke="transparent" />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground">
                  {summary.totalPrintJobs.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">total jobs</span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              {filteredData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.colorVar }}
                    />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">
                      {item.value.toLocaleString()}
                    </span>
                    <span className="w-8 text-right text-xs text-muted-foreground">
                      {totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
