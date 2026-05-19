import { ScanLine, Printer, CheckCircle, XCircle, Users, TrendingUp } from 'lucide-react';
import { StatCard } from './stat-card';
import type { TAnalyticsSummary } from '../types';

interface AnalyticsSummaryGridProps {
  summary: TAnalyticsSummary;
}

export function AnalyticsSummaryGrid({ summary }: AnalyticsSummaryGridProps) {
  const successRate =
    summary.totalPrintJobs > 0
      ? Math.round((summary.completedPrintJobs / summary.totalPrintJobs) * 100)
      : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Total Scans"
        value={summary.totalScans}
        icon={ScanLine}
        accent="neutral"
        animationDelay="delay-0"
      />
      <StatCard
        title="Print Jobs"
        value={summary.totalPrintJobs}
        icon={Printer}
        accent="neutral"
        animationDelay="delay-75"
      />
      <StatCard
        title="Completed"
        value={summary.completedPrintJobs}
        icon={CheckCircle}
        accent="green"
        animationDelay="delay-150"
      />
      <StatCard
        title="Failed"
        value={summary.failedPrintJobs}
        icon={XCircle}
        accent="red"
        animationDelay="delay-300"
      />
      <StatCard
        title="Customers"
        value={summary.uniqueCustomers}
        icon={Users}
        accent="neutral"
        animationDelay="delay-500"
      />
      <StatCard
        title="Success Rate"
        value={`${successRate}%`}
        icon={TrendingUp}
        accent="green"
        successRate={successRate}
        animationDelay="delay-500"
      />
    </div>
  );
}
