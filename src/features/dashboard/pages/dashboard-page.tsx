import { Skeleton } from '@/components/ui/skeleton';
import { profileService } from '@/features/profile/services';
import { usePrintSocket } from '../hooks/use-print-socket';
import { QrCodeCard } from '../components/qr-code-card';
import { SessionStatusCard } from '../components/session-status-card';
import { PrintJobPreview } from '../components/print-job-preview';

export default function DashboardPage() {
  const { data: profile, isLoading } = profileService.useGetMe();
  const clientId = profile?.id;

  const { sessionStatus, currentJob, isConnected, markComplete, markError } =
    usePrintSocket(clientId);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Monitor your print sessions in real time</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <QrCodeCard slug={profile.slug} companyName={profile.companyName} />
        <div className="space-y-4">
          <SessionStatusCard status={sessionStatus} isConnected={isConnected} />
          {(sessionStatus === 'incoming' || sessionStatus === 'printing') && currentJob && (
            <PrintJobPreview
              job={currentJob}
              sessionId={profile.id}
              status={sessionStatus}
              onComplete={markComplete}
              onError={markError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
