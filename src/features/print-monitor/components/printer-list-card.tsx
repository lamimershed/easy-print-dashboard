import { useState } from 'react';
import { ChevronDown, ChevronUp, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrinterFeedback } from '../hooks';

const STATUS_MAP: Record<number, { label: string; class: string }> = {
  3: { label: 'Idle', class: 'bg-primary/10 text-primary' },
  4: {
    label: 'Printing',
    class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  5: { label: 'Stopped', class: 'bg-destructive/10 text-destructive' },
};

function getStatusConfig(status: number) {
  return STATUS_MAP[status] ?? { label: 'Unknown', class: 'bg-muted text-muted-foreground' };
}

export function PrinterListCard() {
  const { printerList, isElectron } = usePrinterFeedback();
  const [isOpen, setIsOpen] = useState(false);

  if (!isElectron) return null;

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-card-soft">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-muted/60 p-2">
            <Monitor className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">All System Printers</p>
            <p className="text-xs text-muted-foreground">
              {printerList.length} printer{printerList.length !== 1 ? 's' : ''} detected
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {/* Printer list */}
      {isOpen && (
        <div className="border-t border-border/60">
          {printerList.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No printers detected.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {printerList.map((p) => {
                const statusCfg = getStatusConfig(p.status);
                return (
                  <li key={p.name} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={cn(
                          'h-2 w-2 shrink-0 rounded-full',
                          p.status === 3
                            ? 'bg-primary'
                            : p.status === 4
                              ? 'bg-amber-500'
                              : 'bg-destructive'
                        )}
                      />
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {p.displayName || p.name}
                        </p>
                        {p.description && (
                          <p className="truncate text-xs text-muted-foreground">{p.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      {p.isDefault && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                          Default
                        </span>
                      )}
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                          statusCfg.class
                        )}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
