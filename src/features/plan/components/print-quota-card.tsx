import { Printer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/format-money';
import type { TPlanUsage } from '../types';

/** Where the bar changes tone. Both are warnings — neither blocks a print. */
const WARN_AT = 0.8;

type TPrintQuotaCardProps = { usage: TPlanUsage };

/**
 * The included-prints counter.
 *
 * Deliberately reassuring above 100%: the allowance is a soft limit, so the copy
 * has to say plainly that nothing stops and nothing extra is charged. A counter
 * that looks like a cliff would have shop owners turning customers away.
 */
export function PrintQuotaCard({ usage }: TPrintQuotaCardProps) {
  const { sheetsUsed, includedSheets, ratio, periodEnd } = usage;
  if (!includedSheets) return null;

  const isOver = ratio >= 1;
  const isNear = !isOver && ratio >= WARN_AT;
  const remaining = Math.max(0, includedSheets - sheetsUsed);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Printer className="size-4 text-muted-foreground" />
          Prints this period
        </CardTitle>
        <CardDescription>
          Your plan includes {includedSheets.toLocaleString('en-IN')} prints. Resets{' '}
          {formatDate(periodEnd)}.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-3xl font-black tabular-nums">
            {sheetsUsed.toLocaleString('en-IN')}
            <span className="ml-1 text-sm font-medium text-muted-foreground">
              / {includedSheets.toLocaleString('en-IN')}
            </span>
          </span>
          <span
            className={cn(
              'text-xs font-medium tabular-nums',
              isOver ? 'text-destructive' : isNear ? 'text-amber-600' : 'text-muted-foreground'
            )}
          >
            {Math.round(ratio * 100)}%
          </span>
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuenow={sheetsUsed}
          aria-valuemin={0}
          aria-valuemax={includedSheets}
          aria-label="Included prints used this period"
        >
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isOver ? 'bg-destructive' : isNear ? 'bg-amber-500' : 'bg-primary'
            )}
            // Clamped so going over does not overflow the track.
            style={{ width: `${Math.min(1, ratio) * 100}%` }}
          />
        </div>

        <p
          className={cn(
            'text-xs',
            isOver ? 'text-destructive' : isNear ? 'text-amber-600' : 'text-muted-foreground'
          )}
        >
          {isOver
            ? `You are ${(sheetsUsed - includedSheets).toLocaleString('en-IN')} prints over your included allowance. Nothing stops and you are not charged extra — this counter is here so you know where you stand.`
            : isNear
              ? `${remaining.toLocaleString('en-IN')} prints left in your allowance. Going over is fine — printing continues and costs you nothing more.`
              : `${remaining.toLocaleString('en-IN')} prints left in your allowance.`}
        </p>
      </CardContent>
    </Card>
  );
}
