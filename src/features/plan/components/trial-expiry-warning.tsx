import { NavLink } from 'react-router';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { planService } from '../services';

/** Days remaining at which the warning starts appearing at all. */
const WARN_FROM_DAYS = 7;
/** Below this it reads as urgent rather than informational. */
const URGENT_DAYS = 3;

type TTrialExpiryWarningProps = {
  /** Hidden on the plan page itself — the banner there already says all this. */
  hideOnPlanPage?: boolean;
};

/**
 * The last-week warning, shown on every page.
 *
 * Expiry is not a soft event: commission goes 0% → 30% and counter collection is
 * force-disabled the moment the reconciler sweeps. A shop that finds that out
 * from a shrunken payout has been treated badly, so this states both changes
 * explicitly rather than saying "your trial is ending".
 */
export function TrialExpiryWarning({ hideOnPlanPage = false }: TTrialExpiryWarningProps) {
  const { data: entitlements } = planService.useGetEntitlements();

  if (hideOnPlanPage) return null;
  if (!entitlements?.isTrial || entitlements.trialDaysRemaining === null) return null;

  const days = entitlements.trialDaysRemaining;
  if (days > WARN_FROM_DAYS) return null;

  const isUrgent = days <= URGENT_DAYS;
  const wasCollectingAtCounter = !entitlements.gatewayCollectionEnabled;

  return (
    <div
      role="status"
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 rounded-2xl border p-4',
        isUrgent
          ? 'border-destructive/40 bg-destructive/[0.07]'
          : 'border-amber-500/40 bg-amber-500/10'
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={cn('mt-0.5 size-4 shrink-0', isUrgent ? 'text-destructive' : 'text-amber-600')}
        />
        <div className="flex flex-col gap-1">
          <p
            className={cn(
              'text-sm font-semibold',
              isUrgent ? 'text-destructive' : 'text-amber-800 dark:text-amber-300'
            )}
          >
            {days === 0
              ? 'Your free trial ends today'
              : `Your free trial ends in ${days} ${days === 1 ? 'day' : 'days'}`}
          </p>
          <p className="text-xs text-muted-foreground">
            When it does you move to the Free plan: commission goes from{' '}
            <span className="font-medium text-foreground">0% to 30%</span> on every job
            {wasCollectingAtCounter
              ? ', and counter collection switches off — customers will have to pay online again.'
              : '.'}{' '}
            Subscribe to keep what you have.
          </p>
        </div>
      </div>

      <Button asChild size="sm" variant={isUrgent ? 'destructive' : 'default'}>
        <NavLink to="/plan">See plans</NavLink>
      </Button>
    </div>
  );
}
