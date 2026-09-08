import { FileText, Image, File, ArrowRight, Settings, Printer } from 'lucide-react';
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
  /** Live page count from the OS spooler while a job is running. */
  pagesPrinted?: number | null;
  totalPages?: number | null;
  /**
   * Why the printer has stopped, when it has. The shop is the only party that
   * can act on this, so it belongs here before anywhere else.
   */
  blockedReason?: string | null;
}

function activeBadgeStatus(stage: PrintStage, blocked: boolean): JobStatus {
  if (blocked) return 'BLOCKED';
  if (stage === 'complete') return 'COMPLETED';
  if (stage === 'error') return 'FAILED';
  if (stage === 'printing' || stage === 'spooling') return 'PRINTING';
  return 'ACTIVE';
}

type JobStatus = TPrintJob['status'] | 'ACTIVE' | 'BLOCKED';

const STATUS_CONFIG: Record<JobStatus, { label: string; className: string; spinner?: boolean }> = {
  ACTIVE: { label: 'Processing', className: 'bg-primary/10 text-primary', spinner: true },
  PENDING: { label: 'In Queue', className: 'bg-muted text-muted-foreground' },
  PRINTING: { label: 'Printing', className: 'bg-primary/10 text-primary', spinner: true },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  FAILED: { label: 'Failed', className: 'bg-destructive/10 text-destructive' },
  BLOCKED: {
    label: 'Needs attention',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
};

function getFileIcon(mimeType: string) {
  if (mimeType?.includes('pdf'))
    return { Icon: FileText, bg: 'bg-destructive/10', color: 'text-destructive' };
  if (mimeType?.includes('image'))
    return { Icon: Image, bg: 'bg-primary/10', color: 'text-primary' };
  return { Icon: File, bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600' };
}

function StatusBadge({ status }: { status: JobStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black uppercase',
        config.className
      )}
    >
      {config.spinner && <Settings className="size-3 animate-spin" />}
      {config.label}
    </span>
  );
}

function ColorModeTag({ colorMode }: { colorMode: 'color' | 'blackwhite' | string }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
        colorMode === 'color' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      )}
    >
      {colorMode === 'color' ? 'Color' : 'B&W'}
    </span>
  );
}

export function LiveQueueCard({
  jobs,
  currentJob,
  printStage,
  isLoading,
  pagesPrinted,
  totalPages,
  blockedReason,
}: LiveQueueCardProps) {
  const pendingCount = jobs.filter((j) => j.status === 'PENDING' || j.status === 'PRINTING').length;
  const totalPending = pendingCount + (currentJob ? 1 : 0);

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-card-soft">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/30 p-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">Live Queue</h3>
          <p className="text-sm font-medium text-muted-foreground">
            {totalPending > 0
              ? `${totalPending} job${totalPending > 1 ? 's' : ''} pending`
              : 'No pending jobs'}
          </p>
        </div>
        <Link
          to="/analytics"
          className="rounded-full bg-primary/10 px-5 py-2 text-sm font-bold text-primary transition-all hover:bg-primary/20"
        >
          View All
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-muted/40">
              <th className="px-6 py-3 text-[11px] font-black tracking-widest text-muted-foreground uppercase">
                File
              </th>
              <th className="px-6 py-3 text-center text-[11px] font-black tracking-widest text-muted-foreground uppercase">
                Copies
              </th>
              <th className="px-6 py-3 text-[11px] font-black tracking-widest text-muted-foreground uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {/* Active WebSocket job */}
            {currentJob && (
              <tr className="bg-primary/5 transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <File className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">
                        {currentJob.fileName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <ColorModeTag colorMode={currentJob.colorMode} />
                        {typeof pagesPrinted === 'number' && (
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {totalPages
                              ? `${pagesPrinted}/${totalPages} pages`
                              : `${pagesPrinted} pages`}
                          </span>
                        )}
                      </div>
                      {blockedReason && (
                        <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                          {blockedReason}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-center text-sm font-bold text-foreground">
                  {currentJob.copies}
                </td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={activeBadgeStatus(printStage, Boolean(blockedReason))} />
                </td>
              </tr>
            )}

            {/* Loading skeletons */}
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-36" />
                        <Skeleton className="h-2.5 w-16" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <Skeleton className="mx-auto h-3 w-6" />
                  </td>
                  <td className="px-6 py-3.5">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>
                </tr>
              ))}

            {/* Empty state */}
            {!isLoading && jobs.length === 0 && !currentJob && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Printer className="size-10 opacity-20" />
                    <p className="text-sm font-medium">Queue is empty</p>
                    <p className="text-xs opacity-60">
                      Jobs will appear here when customers scan the QR
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {/* DB jobs */}
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
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                            bg
                          )}
                        >
                          <Icon className={cn('size-4', color)} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {job.filename}
                          </p>
                          <div className="mt-0.5">
                            <ColorModeTag colorMode={job.colorMode} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center text-sm font-bold text-foreground">
                      {job.copies}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={job.status} />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-border/60 p-5 text-center">
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
