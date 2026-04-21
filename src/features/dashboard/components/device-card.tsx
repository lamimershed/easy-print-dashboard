import { Printer, RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useElectronPrinter } from '@/hooks';

interface DeviceCardProps {
  /** Whether the WebSocket session with the backend is active */
  isConnected: boolean;
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
            className={cn('h-full rounded-full transition-all', barClass)}
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

export function DeviceCard({ isConnected }: DeviceCardProps) {
  const printer = useElectronPrinter();

  const displayName = printer.printerName ?? 'No printer detected';
  const isOnline = isConnected && printer.printerStatus !== 'error';

  const paperSheets =
    printer.paperLevel !== null ? Math.round((printer.paperLevel / 100) * 500) : null;

  const handleDiagnostic = () => {
    printer.refetch();
  };

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-card-soft">
      {/* Header */}
      <div className="border-b border-border p-8">
        <div className="mb-6 flex items-start justify-between">
          <div className="rounded-2xl bg-primary/10 p-3">
            <Printer className="size-7 text-primary" />
          </div>
          <span
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold',
              isOnline ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isOnline ? 'animate-pulse bg-primary' : 'bg-muted-foreground'
              )}
            />
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
        <h3 className="truncate text-2xl font-bold text-foreground">{displayName}</h3>
        <p className="font-medium text-muted-foreground">
          {printer.isElectron ? 'Default System Printer' : 'Open in companion app to detect'}
        </p>
        {printer.error && <p className="mt-1 text-xs text-destructive">{printer.error}</p>}
      </div>

      {/* Levels */}
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

        {/* CMYK per-cartridge if available, otherwise aggregate ink bar */}
        {printer.supplyLevels.filter((s) => s.type === 'ink' || s.type === 'toner').length > 1 ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold tracking-tight text-foreground uppercase">
                Ink Level
              </span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
              {printer.supplyLevels
                .filter((s) => s.type === 'ink' || s.type === 'toner')
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

      {/* Action */}
      <div className="px-8 pb-8">
        {printer.isElectron ? (
          <Button
            className="w-full rounded-full bg-foreground py-6 text-sm font-bold text-background hover:bg-foreground/90"
            onClick={handleDiagnostic}
            disabled={printer.isLoading}
          >
            <RefreshCw className={cn('mr-2 size-4', printer.isLoading && 'animate-spin')} />
            {printer.isLoading ? 'Refreshing…' : 'Refresh Device Info'}
          </Button>
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
