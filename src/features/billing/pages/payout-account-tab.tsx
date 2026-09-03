import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { billingService } from '../services';
import { PayoutAccountForm } from '../components';
import { formatPaise } from '@/utils/format-money';

export function PayoutAccountTab() {
  const { data: account, isLoading } = billingService.useGetPayoutAccount();
  const { data: summary } = billingService.useGetSummary('all');

  if (isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;

  const status = account?.status ?? null;

  if (status === 'ACTIVE') {
    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CheckCircle2 className="size-4 text-primary" />
            Payout account verified
          </CardTitle>
          <CardDescription>
            Your earnings are routed automatically after each payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">Razorpay account</span>
            <span className="font-mono text-xs text-foreground">{account?.razorpayAccountId}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'PENDING') {
    return (
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="size-4 text-amber-600" />
            Verification in progress
          </CardTitle>
          <CardDescription>
            Razorpay is reviewing your details — this usually takes 1–2 business days. You do not
            need to do anything else.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 border-t border-border pt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Razorpay account</span>
            <span className="font-mono text-xs">{account?.razorpayAccountId}</span>
          </div>
          {(summary?.blockedPayoutPaise ?? 0) > 0 && (
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Earnings held meanwhile</span>
              <span className="text-xs font-semibold tabular-nums">
                {formatPaise(summary?.blockedPayoutPaise ?? 0)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {status === 'REJECTED' && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Verification was rejected</span>
            <span className="text-xs opacity-90">
              Razorpay could not verify the details submitted. Check the PAN and address below and
              submit again.
            </span>
          </div>
        </div>
      )}

      {/* The linked-account email is the business's payout contact, which is
          often not the login email — so it is always typed explicitly. */}
      <PayoutAccountForm />
    </div>
  );
}
