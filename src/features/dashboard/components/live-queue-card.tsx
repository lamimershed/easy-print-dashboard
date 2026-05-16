import { FileText, Image, File, ArrowRight, Settings, MoreVertical } from 'lucide-react';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TPrintJob } from '@/features/analytics';
import type { PrintStage } from '@/types/electron';

interface PrintIncomingPayload {
  fileName: string;
  fileType: string;
  fileSize: number;
  copies: number;
  colorMode: 'color' | 'blackwhite';
}

interface LiveQueueCardProps {
  jobs: TPrintJob[];
  currentJob: PrintIncomingPayload | null;
  printStage: PrintStage;
  isLoading: boolean;
}

function activeBadgeStatus(stage: PrintStage): JobStatus {
  if (stage === 'complete') return 'COMPLETED';
  if (stage === 'error') return 'FAILED';
  if (stage === 'printing' || stage === 'spooling') return 'PRINTING';
  return 'ACTIVE';
}

type JobStatus = TPrintJob['status'] | 'ACTIVE';

const STATUS_CONFIG: Record<JobStatus, { label: string; className: string; spinner?: boolean }> = {
  ACTIVE: {
    label: 'Processing',
    className: 'bg-primary/10 text-primary',
    spinner: true,
  },
  PENDING: {
    label: 'In Queue',
    className: 'bg-muted text-muted-foreground',
  },
  PRINTING: {
    label: 'Printing',
    className: 'bg-primary/10 text-primary',
    spinner: true,
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-destructive/10 text-destructive',
  },
};

function getFileIcon(mimeType: string) {
  if (mimeType?.includes('pdf')) {
    return { Icon: FileText, bg: 'bg-destructive/10', color: 'text-destructive' };
  }
  if (mimeType?.includes('image')) {
    return { Icon: Image, bg: 'bg-primary/10', color: 'text-primary' };
  }
  return { Icon: File, bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600' };
}

function StatusBadge({ status }: { status: JobStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase',
        config.className
      )}
    >
      {config.spinner && <Settings className="size-3 animate-spin" />}
      {config.label}
    </span>
  );
}

export function LiveQueueCard({ jobs, currentJob, printStage, isLoading }: LiveQueueCardProps) {
  const pendingCount = jobs.filter((j) => j.status === 'PENDING' || j.status === 'PRINTING').length;
  const activeCount = currentJob ? 1 : 0;
  const totalPending = pendingCount + activeCount;

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-card-soft">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/30 p-8">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Live Queue</h3>
          <p className="text-sm font-medium text-muted-foreground">
            {totalPending > 0
              ? `${totalPending} job${totalPending > 1 ? 's' : ''} pending in stack`
              : 'No pending jobs'}
          </p>
        </div>
        <Link
          to="/analytics"
          className="rounded-full bg-amber-200 px-6 py-2 text-sm font-bold text-amber-800 transition-transform hover:scale-95 dark:bg-amber-800 dark:text-amber-200"
        >
          View All
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-muted/40">
              <th className="px-8 py-4 text-[11px] font-black tracking-widest text-muted-foreground uppercase">
                File Name
              </th>
              <th className="px-8 py-4 text-center text-[11px] font-black tracking-widest text-muted-foreground uppercase">
                Copies
              </th>
              <th className="px-8 py-4 text-[11px] font-black tracking-widest text-muted-foreground uppercase">
                Status
              </th>
              <th className="px-8 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {/* Active WebSocket job shown first */}
            {currentJob && (
              <tr className="bg-primary/5 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <File className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{currentJob.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {currentJob.colorMode} · {currentJob.fileType}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-center text-sm font-bold text-foreground">
                  {currentJob.copies}
                </td>
                <td className="px-8 py-5">
                  <StatusBadge status={activeBadgeStatus(printStage)} />
                </td>
                <td className="px-8 py-5 text-right">
                  <MoreVertical className="ml-auto size-4 text-muted-foreground" />
                </td>
              </tr>
            )}

            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-36" />
                        <Skeleton className="h-2.5 w-24" />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <Skeleton className="mx-auto h-3 w-6" />
                  </td>
                  <td className="px-8 py-5">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>
                  <td />
                </tr>
              ))}

            {!isLoading && jobs.length === 0 && !currentJob && (
              <tr>
                <td colSpan={4} className="px-8 py-12 text-center text-sm text-muted-foreground">
                  No print jobs yet.
                </td>
              </tr>
            )}

            {!isLoading &&
              jobs.map((job) => {
                const { Icon, bg, color } = getFileIcon(job.mimeType);
                return (
                  <tr
                    key={job.id}
                    className={cn(
                      'transition-colors hover:bg-muted/30',
                      job.status === 'PRINTING' && 'bg-primary/5'
                    )}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            bg
                          )}
                        >
                          <Icon className={cn('size-5', color)} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{job.filename}</p>
                          <p className="text-xs text-muted-foreground">{job.colorMode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center text-sm font-bold text-foreground">
                      {job.copies}
                    </td>
                    <td className="px-8 py-5">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <MoreVertical className="ml-auto size-4 text-muted-foreground" />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-border/60 p-8 text-center">
        <Link
          to="/analytics"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          View Full History
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
