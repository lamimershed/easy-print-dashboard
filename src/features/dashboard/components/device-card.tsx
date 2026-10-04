import type { ReactNode } from 'react';
import { AlertTriangle, Info, Printer, RefreshCw, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePrinterFeedback, PrintStageStepper } from '@/features/print-monitor';
import type { PrinterAlert, PrinterDetails } from '@/types/electron';

interface DeviceCardProps {
  /** True only once the server accepted `client:join` — see the print-socket store. */
  isConnected: boolean;
  /** Why not, when it is false. */
  connectionError?: string | null;
}

type UnifiedStatus = {
  label: string;
  description: string;
  dotClass: string;
  badgeClass: string;
  pulse: boolean;
};

function getUnifiedStatus(
  isConnected: boolean,
  connectionError: string | null | undefined,
  printer: ReturnType<typeof usePrinterFeedback>
): UnifiedStatus {
  // The printer's own words beat a generic line, when it gave us any.
  const firstError = printer.details?.alerts.find((a) => a.severity === 'error')?.message;
  if (!printer.isElectron) {
    return {
      label: 'Companion Required',
      description: 'Open the Easy Print desktop app',
      dotClass: 'bg-muted-foreground',
      badgeClass: 'bg-muted text-muted-foreground',
      pulse: false,
    };
  }
  // Before anything about the printer: with no accepted session on the server,
  // customers scanning the QR are told this shop is closed, whatever the
  // hardware is doing. This used to read "Ready to Print · Server reconnecting",
  // which is how a shop could sit here looking healthy for hours while no
  // customer could reach it.
  if (!isConnected) {
    return {
      label: 'Not Reachable',
      description: connectionError ?? 'Connecting to the server…',
      dotClass: 'bg-destructive',
      badgeClass: 'bg-destructive/10 text-destructive',
      pulse: false,
    };
  }
  if (!printer.loaded) {
    return {
      label: 'Checking…',
      description: 'Reading printer status',
      dotClass: 'bg-muted-foreground',
      badgeClass: 'bg-muted text-muted-foreground',
      pulse: true,
    };
  }
  if (!printer.printerName) {
    return {
      label: 'No Printer Found',
      description: 'No printer detected on this system',
      dotClass: 'bg-muted-foreground',
      badgeClass: 'bg-muted text-muted-foreground',
      pulse: false,
    };
  }
  if (printer.isError) {
    return {
      label: 'Printer Error',
      description: printer.error ?? 'Check printer hardware',
      dotClass: 'bg-destructive',
      badgeClass: 'bg-destructive/10 text-destructive',
      pulse: false,
    };
  }
  if (!printer.isPrinterConnected || printer.printerStatus === 'disconnected') {
    return {
      label: 'Printer Offline',
      description: firstError ?? 'Printer is not responding',
      dotClass: 'bg-amber-500',
      badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      pulse: false,
    };
  }
  if (printer.printerStatus === 'queue_stopped') {
    return {
      label: 'Queue Paused',
      description: firstError ?? 'Print queue paused — check printer',
      dotClass: 'bg-amber-500',
      badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      pulse: true,
    };
  }
  if (printer.isBusy) {
    return {
      label: 'Printing…',
      description: 'Job in progress',
      dotClass: 'bg-primary',
      badgeClass: 'bg-primary/10 text-primary',
      pulse: true,
    };
  }
  return {
    label: 'Ready to Print',
    description: 'System connected · Printer online',
    dotClass: 'bg-primary',
    badgeClass: 'bg-primary/10 text-primary',
    pulse: true,
  };
}

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
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold tracking-tight text-foreground uppercase">{label}</span>
        {levelPercent !== null ? (
          <span className={cn('text-xs font-bold', barClass.replace('bg-', 'text-'))}>
            {level}%
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {levelPercent !== null && (
          <div
            className={cn('h-full rounded-full transition-all', barClass)}
            style={{ width: `${level}%` }}
          />
        )}
      </div>
      {suffix && (
        <p className="mt-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          {suffix}
        </p>
      )}
    </div>
  );
}

function CapabilityChips({ details }: { details: PrinterDetails }) {
  const caps = details.capabilities;
  const chips: { label: string; on: boolean; title?: string }[] = [];
  if (caps?.color != null) {
    chips.push({ label: caps.color ? 'Color' : 'Black & white only', on: caps.color });
  }
  if (caps?.twoSided != null) {
    chips.push({
      label: caps.twoSided ? 'Two-sided' : 'One-sided only',
      on: caps.twoSided,
      title: caps.twoSided
        ? 'As reported by the printer driver — some printers need the pages turned by hand'
        : undefined,
    });
  }
  if (chips.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip.label}
          title={chip.title}
          className={cn(
            'rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase',
            chip.on ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}

const ALERT_CLASS: Record<PrinterAlert['severity'], string> = {
  error: 'bg-destructive/10 text-destructive',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  info: 'bg-muted text-muted-foreground',
};

function PrinterAlerts({ alerts }: { alerts: PrinterAlert[] }) {
  return (
    <ul className="mt-3 space-y-1.5">
      {alerts.map((alert) => (
        <li
          key={alert.code}
          className={cn(
            'flex items-start gap-2 rounded-lg px-3 py-2 text-xs',
            ALERT_CLASS[alert.severity]
          )}
        >
          {alert.severity === 'info' ? (
            <Info className="mt-0.5 size-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          )}
          <span>{alert.message}</span>
        </li>
      ))}
    </ul>
  );
}

const PAPER_SIZES_SHOWN = 8;

/** Every detail the printer reported, and nothing it did not. */
function PrinterDetailsList({ details }: { details: PrinterDetails }) {
  const { connection, driver, defaults, capabilities } = details;
  const rows: [string, ReactNode][] = [];

  if (connection.label) {
    const where = connection.address ?? connection.port;
    rows.push(['Connection', [connection.label, where].filter(Boolean).join(' · ')]);
  }
  if (connection.present !== null) {
    rows.push(['Device', connection.present ? 'Detected' : 'Not detected']);
  }
  if (connection.sharedOnNetwork) rows.push(['Sharing', 'Shared with other PCs']);
  if (details.queue.jobs !== null) rows.push(['Jobs waiting', String(details.queue.jobs)]);
  if (details.location) rows.push(['Location', details.location]);
  if (details.comment) rows.push(['Note', details.comment]);
  if (driver) {
    const maker =
      driver.manufacturer &&
      !driver.name.toLowerCase().startsWith(driver.manufacturer.toLowerCase())
        ? driver.manufacturer
        : null;
    rows.push([
      'Driver',
      [maker, driver.name, driver.version && `v${driver.version}`].filter(Boolean).join(' · '),
    ]);
  }
  const defaultsText = defaults
    ? [defaults.color, defaults.sides, defaults.paperSize, defaults.orientation]
        .filter(Boolean)
        .join(' · ')
    : '';
  if (defaultsText) rows.push(['Defaults', defaultsText]);
  if (capabilities?.maxCopies) rows.push(['Max copies', String(capabilities.maxCopies)]);
  const sizes = capabilities?.paperSizes ?? [];
  if (sizes.length > 0) {
    const extra = sizes.length - PAPER_SIZES_SHOWN;
    rows.push([
      'Paper sizes',
      <span title={sizes.join(', ')}>
        {sizes.slice(0, PAPER_SIZES_SHOWN).join(', ')}
        {extra > 0 && ` +${extra} more`}
      </span>,
    ]);
  }

  if (rows.length === 0) return null;
  return (
    <div className="border-b border-border px-6 py-4">
      <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
        Printer details
      </p>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 py-1.5">
            <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
            <dd className="min-w-0 text-right text-xs font-medium break-words text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function DeviceCard({ isConnected, connectionError }: DeviceCardProps) {
  const printer = usePrinterFeedback();
  const status = getUnifiedStatus(isConnected, connectionError, printer);
  const displayName =
    printer.printerName ?? (printer.loaded ? 'No printer detected' : 'Checking printer…');
  const paperSheets =
    printer.paperLevel !== null ? Math.round((printer.paperLevel / 100) * 500) : null;

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-card-soft">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Printer className="size-6 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            {printer.printQueue.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                {printer.printQueue.length} queued
              </span>
            )}
            <span
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold',
                status.badgeClass
              )}
            >
              <span
                className={cn(
                  'size-2 rounded-full',
                  status.dotClass,
                  status.pulse && 'animate-pulse'
                )}
              />
              {status.label}
            </span>
          </div>
        </div>

        <h3 className="truncate text-xl font-bold text-foreground">{displayName}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{status.description}</p>

        {printer.isElectron && printer.details && <CapabilityChips details={printer.details} />}

        {printer.details && printer.details.alerts.length > 0 && (
          <PrinterAlerts alerts={printer.details.alerts} />
        )}

        {printer.stale && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Showing the last reading — the latest check did not answer.
            </p>
          </div>
        )}

        {printer.cupsError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Ink levels unavailable: {printer.cupsError}
            </p>
          </div>
        )}
      </div>

      {printer.details && <PrinterDetailsList details={printer.details} />}

      {/* Supply levels — only when the printer reports them (USB printers on Windows do not) */}
      {printer.supplyLevels.length > 0 && (
        <div className="space-y-5 border-b border-border p-6">
          {printer.paperLevel !== null && (
            <SupplyBar
              label="Paper"
              levelPercent={printer.paperLevel}
              barClass="bg-primary"
              suffix={paperSheets !== null ? `Approx. ${paperSheets} sheets remaining` : undefined}
            />
          )}

          {printer.supplyLevels.filter((s) => s.type === 'ink').length > 1 ? (
            <div>
              <div className="mb-2">
                <span className="text-xs font-bold tracking-tight text-foreground uppercase">
                  Ink
                </span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                {printer.supplyLevels
                  .filter((s) => s.type === 'ink')
                  .map((s) => {
                    const colorMap: Record<string, string> = {
                      cyan: 'bg-cyan-400',
                      magenta: 'bg-fuchsia-500',
                      yellow: 'bg-yellow-400',
                      black: 'bg-foreground',
                      toner: 'bg-foreground',
                    };
                    const key = Object.keys(colorMap).find((k) => s.name.toLowerCase().includes(k));
                    return (
                      <div
                        key={s.name}
                        className={colorMap[key ?? ''] ?? 'bg-primary'}
                        style={{ width: `${(s.levelPercent ?? 0) / 4}%` }}
                      />
                    );
                  })}
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                {printer.supplyLevels
                  .filter((s) => s.type === 'ink')
                  .map((s) => {
                    const textMap: Record<string, string> = {
                      cyan: 'text-cyan-500',
                      magenta: 'text-fuchsia-500',
                      yellow: 'text-yellow-600',
                      black: 'text-foreground',
                      toner: 'text-foreground',
                    };
                    const key = Object.keys(textMap).find((k) => s.name.toLowerCase().includes(k));
                    return (
                      <span
                        key={s.name}
                        className={cn(
                          'text-[10px] font-bold uppercase',
                          textMap[key ?? ''] ?? 'text-muted-foreground'
                        )}
                      >
                        {key ?? s.name.split('<')[0]}{' '}
                        {s.levelPercent !== null ? `${s.levelPercent}%` : '—'}
                      </span>
                    );
                  })}
              </div>
            </div>
          ) : (
            printer.inkLevel !== null && (
              <SupplyBar label="Ink" levelPercent={printer.inkLevel} barClass="bg-amber-400" />
            )
          )}
        </div>
      )}

      {/* Print Stage Stepper — only visible during an active print */}
      {printer.currentPrintStage !== 'idle' && (
        <div className="border-b border-border px-6">
          <PrintStageStepper currentStage={printer.currentPrintStage} />
        </div>
      )}

      {/* Action */}
      <div className="p-6">
        {printer.isElectron ? (
          <>
            <Button
              className="w-full rounded-full bg-foreground text-sm font-bold text-background hover:bg-foreground/90"
              onClick={() => printer.refetch()}
              disabled={printer.isLoading}
            >
              <RefreshCw className={cn('mr-2 size-4', printer.isLoading && 'animate-spin')} />
              {printer.isLoading ? 'Refreshing…' : 'Refresh Device Info'}
            </Button>
            {printer.lastRefreshedAt && (
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Updated {formatDistanceToNow(printer.lastRefreshedAt, { addSuffix: true })}
              </p>
            )}
          </>
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
