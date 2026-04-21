import { Printer, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DeviceCardProps {
  isConnected: boolean;
}

const PAPER_LEVEL = 85;
const INK_LEVEL = 60;
const PAPER_SHEETS = Math.round((PAPER_LEVEL / 100) * 500);

export function DeviceCard({ isConnected }: DeviceCardProps) {
  const handleDiagnostic = () => {
    toast.info('Running device diagnostic…', { description: 'This may take a few seconds.' });
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
              isConnected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isConnected ? 'animate-pulse bg-primary' : 'bg-muted-foreground'
              )}
            />
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
        <h3 className="text-2xl font-bold text-foreground">Epson L3210</h3>
        <p className="font-medium text-muted-foreground">Shop Floor - Primary Unit</p>
      </div>

      {/* Levels */}
      <div className="space-y-8 p-8">
        {/* Paper Level */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold tracking-tight text-foreground uppercase">
              Paper Level
            </span>
            <span className="text-sm font-bold text-primary">{PAPER_LEVEL}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${PAPER_LEVEL}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Approx. {PAPER_SHEETS} Sheets Remaining
          </p>
        </div>

        {/* Ink Level */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold tracking-tight text-foreground uppercase">
              Ink Level
            </span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {INK_LEVEL}%
            </span>
          </div>
          {/* CMYK bar */}
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-cyan-400" style={{ width: '15%' }} />
            <div className="h-full bg-fuchsia-500" style={{ width: '15%' }} />
            <div className="h-full bg-yellow-400" style={{ width: '15%' }} />
            <div className="h-full bg-foreground" style={{ width: '15%' }} />
          </div>
          <p className="mt-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Maintenance due in 12 days
          </p>
        </div>
      </div>

      {/* Action */}
      <div className="px-8 pb-8">
        <Button
          className="w-full rounded-full bg-foreground py-6 text-sm font-bold text-background hover:bg-foreground/90"
          onClick={handleDiagnostic}
        >
          <Wifi className="mr-2 size-4" />
          Run Device Diagnostic
        </Button>
      </div>
    </div>
  );
}
