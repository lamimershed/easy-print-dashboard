import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { billingService } from '../services';
import { EarningsChart, EarningsSummaryGrid, KycStatusBanner } from '../components';
import { PricingSummaryCard } from '@/features/pricing';
import type { TBillingPeriod } from '../types';

const PERIODS: Array<{ value: TBillingPeriod; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export function EarningsTab() {
  const [period, setPeriod] = useState<TBillingPeriod>('30d');
  const { data: summary, isLoading } = billingService.useGetSummary(period);
  const { data: account } = billingService.useGetPayoutAccount();

  return (
    <div className="flex flex-col gap-5">
      <KycStatusBanner
        status={account?.status ?? null}
        blockedPayoutPaise={summary?.blockedPayoutPaise ?? 0}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Overview</h2>
        <Select value={period} onValueChange={(value) => setPeriod(value as TBillingPeriod)}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading || !summary ? (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      ) : (
        <>
          <EarningsSummaryGrid summary={summary} />

          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0">
              <EarningsChart series={summary.series} />
            </div>
            <PricingSummaryCard />
          </div>

          {summary.gatewayFeePaise > 0 && (
            <p className="text-xs text-muted-foreground">
              Payment gateway fees of{' '}
              <span className="font-medium text-foreground tabular-nums">
                ₹{(summary.gatewayFeePaise / 100).toFixed(2)}
              </span>{' '}
              were charged on these payments and are absorbed by the platform, not deducted from
              your earnings.
            </p>
          )}
        </>
      )}
    </div>
  );
}
