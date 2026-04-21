import { Users, TrendingUp, Printer, CheckCircle } from 'lucide-react';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { profileService } from '@/features/profile/services';
import { analyticsService } from '@/features/analytics';
import { usePrintSocket } from '../hooks/use-print-socket';
import { DashboardGreeting } from '../components/dashboard-greeting';
import { StatCard } from '../components/stat-card';
import { DeviceCard } from '../components/device-card';
import { LiveQueueCard } from '../components/live-queue-card';

export default function DashboardPage() {
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = profileService.useGetMe();
  const { data: summary, isLoading: summaryLoading } = analyticsService.useGetSummary('7d');
  const { data: jobsData, isLoading: jobsLoading } = analyticsService.useGetPrintJobs(1, 5);

  const { sessionStatus, currentJob, isConnected } = usePrintSocket(profile?.id);

  if (profileLoading) {
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-16 w-80" />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-12">
          <Skeleton className="h-96 rounded-xl lg:col-span-5" />
          <Skeleton className="h-96 rounded-xl lg:col-span-7" />
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-lg font-semibold text-foreground">Unable to load dashboard</p>
        <p className="text-sm text-muted-foreground">
          Could not fetch your profile. Please refresh the page or try again later.
        </p>
      </div>
    );
  }

  const activeJob =
    sessionStatus === 'incoming' || sessionStatus === 'printing' ? currentJob : null;

  return (
    <div className="relative min-h-full p-8">
      {/* Greeting */}
      <DashboardGreeting companyName={profile.companyName} />

      {/* Stats Row */}
      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          variant="green"
          label="Today's Customers"
          value={summaryLoading ? '—' : (summary?.uniqueCustomers ?? 0)}
          subLabel={summary ? `${summary.totalScans} QR scans` : 'Loading…'}
          SubIcon={TrendingUp}
          DecorIcon={Users}
          isLoading={summaryLoading}
        />
        <StatCard
          variant="white"
          label="Completed Jobs"
          value={summaryLoading ? '—' : (summary?.completedPrintJobs ?? 0)}
          subLabel={summary ? `of ${summary.totalPrintJobs} total` : 'Loading…'}
          SubIcon={CheckCircle}
          DecorIcon={CheckCircle}
          isLoading={summaryLoading}
        />
        <StatCard
          variant="lime"
          label="Total Prints"
          value={summaryLoading ? '—' : (summary?.totalPrintJobs ?? 0)}
          subLabel={
            summary
              ? `${summary.completedPrintJobs} completed / ${summary.failedPrintJobs} failed`
              : 'Loading…'
          }
          SubIcon={Printer}
          DecorIcon={Printer}
          isLoading={summaryLoading}
        />
      </div>

      {/* Device + Queue */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <DeviceCard isConnected={isConnected} />
        </div>
        <div className="lg:col-span-7">
          <LiveQueueCard
            jobs={jobsData?.data ?? []}
            currentJob={activeJob}
            isLoading={jobsLoading}
          />
        </div>
      </div>

      {/* FAB */}
      <Link
        to="/analytics"
        className="fixed right-10 bottom-10 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0px_12px_32px_rgba(0,105,78,0.3)] transition-transform hover:scale-110 active:scale-95"
        title="View analytics"
      >
        <span className="text-2xl leading-none font-bold">+</span>
      </Link>
    </div>
  );
}
