import { billingService } from '../services';
import { KycStatusBanner, PayoutsTable } from '../components';

export function PayoutsTab() {
  const { data: account } = billingService.useGetPayoutAccount();
  const { data: summary } = billingService.useGetSummary('all');

  return (
    <div className="flex flex-col gap-5">
      <KycStatusBanner
        status={account?.status ?? null}
        blockedPayoutPaise={summary?.blockedPayoutPaise ?? 0}
      />

      <div>
        <h2 className="text-sm font-semibold text-foreground">Payouts</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Your share of each payment, routed to your Razorpay account.
        </p>
      </div>

      <PayoutsTable />
    </div>
  );
}
