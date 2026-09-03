import { Banknote, HandCoins, Percent, RotateCcw, Wallet } from 'lucide-react';
import { StatCard } from '@/features/analytics/components/stat-card';
import { formatPaise } from '@/utils/format-money';
import type { TBillingSummary } from '../types';

const PERIOD_LABEL: Record<string, string> = {
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  '90d': 'last 90 days',
  all: 'all time',
};

/**
 * Net earnings is the headline: it already has the client's share of refunds
 * taken out, so a shop never sees revenue it had to give back.
 */
export function EarningsSummaryGrid({ summary }: { summary: TBillingSummary }) {
  const period = PERIOD_LABEL[summary.period] ?? summary.period;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        title="Net earnings"
        value={formatPaise(summary.netEarningsPaise)}
        icon={Wallet}
        accent="green"
        subtext={`Yours to keep · ${period}`}
        animationDelay="delay-0"
      />
      <StatCard
        title="Gross volume"
        value={formatPaise(summary.grossPaise)}
        icon={Banknote}
        subtext={`${summary.transactionCount} payment${summary.transactionCount === 1 ? '' : 's'}`}
        animationDelay="delay-75"
      />
      <StatCard
        title="Platform commission"
        value={formatPaise(summary.commissionPaise)}
        icon={Percent}
        subtext="Deducted before payout"
        animationDelay="delay-150"
      />
      <StatCard
        title="Pending payout"
        value={formatPaise(summary.pendingPayoutPaise)}
        icon={HandCoins}
        accent={summary.blockedPayoutPaise > 0 ? 'red' : 'neutral'}
        subtext={
          summary.blockedPayoutPaise > 0
            ? `${formatPaise(summary.blockedPayoutPaise)} held for verification`
            : 'On its way to your account'
        }
        animationDelay="delay-200"
      />
      <StatCard
        title="Refunded"
        value={formatPaise(summary.refundedPaise)}
        icon={RotateCcw}
        accent={summary.refundedPaise > 0 ? 'red' : 'neutral'}
        subtext={`${summary.refundCount} refund${summary.refundCount === 1 ? '' : 's'}`}
        animationDelay="delay-300"
      />
    </div>
  );
}
