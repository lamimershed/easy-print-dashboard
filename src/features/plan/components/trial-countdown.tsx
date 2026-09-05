import { NavLink } from 'react-router';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { planService } from '../services';

/** Below this the tone escalates — the shop needs to decide, not just be informed. */
const URGENT_DAYS = 7;

type TTrialCountdownProps = {
  /** Collapsed rail: an icon and the bare number is all that fits. */
  collapsed?: boolean;
};

/**
 * The trial clock, in the app shell.
 *
 * Every shop now signs up onto a 30-day trial, so this is running for everyone
 * from day one. A countdown only visible on the plan page is a countdown nobody
 * sees — which is how a shop ends up discovering the drop to 30% by noticing a
 * smaller payout.
 */
export function TrialCountdown({ collapsed = false }: TTrialCountdownProps) {
  const { data: entitlements } = planService.useGetEntitlements();

  if (!entitlements?.isTrial || entitlements.trialDaysRemaining === null) return null;

  const days = entitlements.trialDaysRemaining;
  const isUrgent = days <= URGENT_DAYS;

  return (
    <NavLink
      to="/plan"
      className={cn(
        'flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors',
        isUrgent
          ? 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15'
          : 'border-primary/30 bg-primary/[0.06] hover:bg-primary/[0.1]',
        collapsed && 'justify-center px-0 py-2'
      )}
      title={
        days === 0
          ? 'Your free trial ends today'
          : `${days} days left in your free trial — Business`
      }
    >
      <Sparkles
        className={cn('size-4 shrink-0', isUrgent ? 'text-amber-600' : 'text-primary')}
        aria-hidden
      />

      {!collapsed && (
        <div className="flex min-w-0 flex-col leading-tight">
          <span
            className={cn(
              'truncate text-xs font-semibold',
              isUrgent ? 'text-amber-700 dark:text-amber-300' : 'text-foreground'
            )}
          >
            {days === 0 ? 'Trial ends today' : `${days} ${days === 1 ? 'day' : 'days'} left`}
          </span>
          <span className="truncate text-[10px] text-muted-foreground">
            Business trial · see plans
          </span>
        </div>
      )}
    </NavLink>
  );
}
