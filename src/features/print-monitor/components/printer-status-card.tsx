import { Printer, RefreshCw, WifiOff, AlertTriangle, Clock, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePrinterFeedback } from '../hooks';
import { PrintStageStepper } from './print-stage-stepper';
import type { PrinterStatus } from '../types';

function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Never';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m ago`;
}

const STATUS_CONFIG: Record<
  PrinterStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  idle: {
    label: 'Idle',
    dotClass: 'bg-primary animate-pulse',
    badgeClass: 'bg-primary/10 text-primary',
  },
  printing: {
    label: 'Printing',
    dotClass: 'bg-amber-500 animate-pulse',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  error: {
    label: 'Error',
    dotClass: 'bg-destructive',
    badgeClass: 'bg-destructive/10 text-destructive',
  },
  queue_stopped: {
    label: 'Reconnecting',
    dotClass: 'bg-amber-500 animate-pulse',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  disconnected: {
    label: 'Disconnected',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  unknown: {
    label: 'Unknown',
    dotClass: 'bg-muted-foreground',
    badgeClass: 'bg-muted text-muted-foreground',
  },
};

function SupplyBar({
  label,
  levelPercent,
  barClass,
  suffix,
}: {
  label: string;
  levelPercent: number | null;
  barClass: string;
  suffix?: string;
}) {
  const level = levelPercent ?? 0;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold tracking-tight text-foreground uppercase">{label}</span>
        {levelPercent !== null ? (
          <span className={cn('text-sm font-bold', barClass.replace('bg-', 'text-'))}>
            {level}%
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">N/A</span>
        )}
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        {levelPercent !== null && (
          <div
            className={cn('h-full rounded-full transition-all duration-500', barClass)}
            style={{ width: `${level}%` }}
          />
        )}
      </div>
      {suffix && (
        <p className="mt-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          {suffix}
        </p>
      )}
    </div>
  );
}

export function PrinterStatusCard() {
  const printer = usePrinterFeedback();

  const displayName = printer.printerName ?? 'No printer detected';
  const statusConfig = STATUS_CONFIG[printer.printerStatus];

  const paperSheets =
    printer.paperLevel !== null ? Math.round((printer.paperLevel / 100) * 500) : null;

  const cmykSupplies = printer.supplyLevels.filter((s) => s.type === 'ink');
  const hasMultipleInk = cmykSupplies.length > 1;

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-card-soft">
      {/* Header */}
      <div className="border-b border-border p-8">
        <div className="mb-6 flex items-start justify-between">
          <div className="rounded-2xl bg-primary/10 p-3">
            <Printer className="size-7 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold',
                statusConfig.badgeClass
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', statusConfig.dotClass)} />
              {statusConfig.label.toUpperCase()}
            </span>
            {printer.printQueue.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">
                <List className="size-3" />
                {printer.printQueue.length}
              </span>
            )}
          </div>
        </div>
        <h3 className="truncate text-2xl font-bold text-foreground">{displayName}</h3>
        <p className="font-medium text-muted-foreground">
          {printer.isElectron ? 'Default System Printer' : 'Open in companion app to detect'}
        </p>

        {printer.cupsError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300">CUPS: {printer.cupsError}</p>
          </div>
        )}

        {printer.error && !printer.cupsError && (
          <p className="mt-1 text-xs text-destructive">{printer.error}</p>
        )}
      </div>

      {/* Print stage stepper (only shown when a job is active) */}
      {printer.currentPrintStage !== 'idle' && (
        <div className="border-b border-border px-8">
          <PrintStageStepper currentStage={printer.currentPrintStage} />
        </div>
      )}

      {/* Print queue (only shown when there are pending jobs) */}
      {printer.printQueue.length > 0 && (
        <div className="border-b border-border px-8 py-4">
          <div className="mb-2 flex items-center gap-2">
            <List className="size-4 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground uppercase">
              Print Queue ({printer.printQueue.length})
            </span>
          </div>
          <ul className="space-y-1">
            {printer.printQueue.map((job) => (
              <li key={job.id} className="flex items-center justify-between text-xs">
                <span className="truncate text-foreground">{job.fileName}</span>
                <span className="ml-2 shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                  {job.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Supply levels */}
      <div className="space-y-8 p-8">
        <SupplyBar
          label="Paper Level"
          levelPercent={printer.paperLevel}
          barClass="bg-primary"
          suffix={
            paperSheets !== null
              ? `Approx. ${paperSheets} Sheets Remaining`
              : 'Supply data unavailable — requires CUPS driver'
          }
        />

        {hasMultipleInk ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold tracking-tight text-foreground uppercase">
                Ink Level (CMYK)
              </span>
            </div>
            <div className="space-y-2">
              {cmykSupplies.map((s) => {
                const colorMap: Record<string, string> = {
                  cyan: 'bg-cyan-400',
                  magenta: 'bg-fuchsia-500',
                  yellow: 'bg-yellow-400',
                  black: 'bg-foreground',
                  toner: 'bg-foreground',
                };
                const key = Object.keys(colorMap).find((k) => s.name.toLowerCase().includes(k));
                const barClass = colorMap[key ?? ''] ?? 'bg-primary';
                return (
                  <div key={s.name}>
                    <div className="mb-1 flex justify-between">
                      <span className="text-xs font-semibold text-muted-foreground capitalize">
                        {s.name}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {s.levelPercent !== null ? `${s.levelPercent}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full', barClass)}
                        style={{ width: `${s.levelPercent ?? 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <SupplyBar
            label="Ink Level"
            levelPercent={printer.inkLevel}
            barClass="bg-amber-400"
            suffix={
              printer.inkLevel === null
                ? 'Supply data unavailable — requires CUPS driver'
                : undefined
            }
          />
        )}
      </div>

      {/* Footer / actions */}
      <div className="px-8 pb-8">
        {printer.isElectron ? (
          <div className="space-y-3">
            <Button
              className="w-full rounded-full bg-foreground py-6 text-sm font-bold text-background hover:bg-foreground/90"
              onClick={printer.refetch}
              disabled={printer.isLoading}
            >
              <RefreshCw className={cn('mr-2 size-4', printer.isLoading && 'animate-spin')} />
              {printer.isLoading ? 'Refreshing…' : 'Refresh Device Info'}
            </Button>
            {printer.lastRefreshedAt && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3" />
                Last refreshed: {formatRelativeTime(printer.lastRefreshedAt)}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
            <WifiOff className="size-4 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Open the Easy Print companion app for live device info.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
