import { ScanLine, Printer, CheckCircle, XCircle, Users } from 'lucide-react';
import { StatCard } from './stat-card';
import type { TAnalyticsSummary } from '../types';

interface AnalyticsSummaryGridProps {
  summary: TAnalyticsSummary;
}

export function AnalyticsSummaryGrid({ summary }: AnalyticsSummaryGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatCard title="Total Scans" value={summary.totalScans} icon={ScanLine} />
      <StatCard title="Print Jobs" value={summary.totalPrintJobs} icon={Printer} />
      <StatCard title="Completed" value={summary.completedPrintJobs} icon={CheckCircle} />
      <StatCard title="Failed" value={summary.failedPrintJobs} icon={XCircle} />
      <StatCard title="Unique Customers" value={summary.uniqueCustomers} icon={Users} />
    </div>
  );
}
