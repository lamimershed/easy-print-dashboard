import { Link } from 'react-router';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPaise } from '@/utils/format-money';
import type { TRazorpayAccountStatus } from '../types';

type TKycStatusBannerProps = {
  status: TRazorpayAccountStatus | null;
  blockedPayoutPaise?: number;
  /** Hidden on the payout-account tab itself, where the form is the answer. */
  showAction?: boolean;
};

/**
 * The highest-value element on the billing screen: held earnings are the most
 * likely support ticket, and this is what turns one into a self-service fix.
 */
export function KycStatusBanner({
  status,
  blockedPayoutPaise = 0,
  showAction = true,
}: TKycStatusBannerProps) {
  if (status === 'ACTIVE') return null;

  const config =
    status === 'PENDING'
      ? {
          Icon: Clock,
          tone: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
          title: 'Payout account is being verified',
          body: 'Razorpay usually completes this within 1–2 business days. Payments keep working; earnings are released the moment verification finishes.',
        }
      : status === 'REJECTED'
        ? {
            Icon: XCircle,
            tone: 'border-destructive/30 bg-destructive/10 text-destructive',
            title: 'Payout account was rejected',
            body: 'Razorpay could not verify the details submitted. Correct them and resubmit to start receiving earnings.',
          }
        : {
            Icon: AlertTriangle,
            tone: 'border-destructive/30 bg-destructive/10 text-destructive',
            title: 'You cannot be paid yet',
            body: 'Set up your payout account to receive earnings. Customers can still pay you — the money is held until this is done.',
          };

  const { Icon, tone, title, body } = config;

  return (
    <div className={cn('flex items-start gap-3 rounded-2xl border p-4', tone)}>
      <Icon className="mt-0.5 size-5 shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-semibold">{title}</span>
        <p className="text-xs leading-relaxed opacity-90">{body}</p>

        {blockedPayoutPaise > 0 && (
          <p className="mt-1 text-xs font-semibold tabular-nums">
            {formatPaise(blockedPayoutPaise)} held so far
          </p>
        )}
      </div>

      {showAction && (
        <Link
          to="/billing/payout-account"
          className="shrink-0 rounded-lg border border-current px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
        >
          {status === 'REJECTED' ? 'Fix details' : 'Set up'}
        </Link>
      )}
    </div>
  );
}

export function KycActiveNotice() {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-primary">
      <CheckCircle2 className="size-4 shrink-0" />
      <span className="text-sm font-medium">
        Payout account verified — earnings settle automatically.
      </span>
    </div>
  );
}
