import { Gift, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/format-money';
import type { TEntitlements } from '../types';

const TRIAL_LENGTH_DAYS = 30;

type TTrialBannerProps = {
  entitlements: TEntitlements;
  onStartTrial: () => void;
  isStarting: boolean;
};

/**
 * Two states in one component because they are the same story: the shop has not
 * started its free month, or it is counting down. Once the trial is spent and
 * over, neither applies and nothing renders.
 */
export function TrialBanner({ entitlements, onStartTrial, isStarting }: TTrialBannerProps) {
  const { isTrial, trialDaysRemaining, trialAvailable, subscription } = entitlements;

  if (trialAvailable && !subscription) {
    return (
      <Card className="border-primary/30 bg-primary/[0.04]">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-1">
          <div className="flex items-start gap-3">
            <Gift className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Your first month is free</p>
              <p className="text-xs text-muted-foreground">
                Full Business plan for 30 days — no commission, 4,000 prints included, and you can
                collect at your counter. No card needed, nothing is charged.
              </p>
            </div>
          </div>

          <Button size="sm" disabled={isStarting} onClick={onStartTrial}>
            {isStarting && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Start free month
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isTrial || trialDaysRemaining === null) return null;

  const daysUsed = Math.max(0, TRIAL_LENGTH_DAYS - trialDaysRemaining);
  const ratio = Math.min(1, daysUsed / TRIAL_LENGTH_DAYS);
  // The last few days are when the shop needs to decide, so the bar changes tone.
  const isEnding = trialDaysRemaining <= 5;

  return (
    <Card className={cn('border-primary/30 bg-primary/[0.04]', isEnding && 'border-amber-500/40')}>
      <CardContent className="flex flex-col gap-3 py-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className={cn('size-4 text-primary', isEnding && 'text-amber-500')} />
            <span className="text-sm font-semibold">
              {trialDaysRemaining === 0
                ? 'Your free trial ends today'
                : `${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'day' : 'days'} left in your free trial`}
            </span>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            Day {daysUsed} of {TRIAL_LENGTH_DAYS} · ends{' '}
            {formatDate(subscription?.currentPeriodEnd)}
          </span>
        </div>

        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuenow={daysUsed}
          aria-valuemin={0}
          aria-valuemax={TRIAL_LENGTH_DAYS}
          aria-label="Free trial progress"
        >
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isEnding ? 'bg-amber-500' : 'bg-primary'
            )}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          When the trial ends you move to the Free plan — commission jumps to 30% and payments go
          back through the platform. Subscribe below to keep Business.
        </p>
      </CardContent>
    </Card>
  );
}
