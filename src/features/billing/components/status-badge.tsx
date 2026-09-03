import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TPaymentStatus, TPayoutStatus, TRefundStatus } from '../types';

type TTone = 'good' | 'warn' | 'bad' | 'muted';

const TONE_CLASS: Record<TTone, string> = {
  good: 'border-primary/30 bg-primary/10 text-primary',
  warn: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  bad: 'border-destructive/30 bg-destructive/10 text-destructive',
  muted: 'border-border bg-muted text-muted-foreground',
};

const PAYMENT_TONE: Record<TPaymentStatus, TTone> = {
  CREATED: 'muted',
  AUTHORIZED: 'warn',
  CAPTURED: 'good',
  FAILED: 'bad',
  EXPIRED: 'muted',
  PARTIALLY_REFUNDED: 'warn',
  REFUNDED: 'bad',
};

const PAYOUT_TONE: Record<TPayoutStatus, TTone> = {
  NOT_APPLICABLE: 'muted',
  PENDING: 'warn',
  PROCESSING: 'warn',
  COMPLETED: 'good',
  PARTIALLY_REVERSED: 'warn',
  REVERSED: 'bad',
  FAILED: 'bad',
  BLOCKED_KYC: 'bad',
};

const REFUND_TONE: Record<TRefundStatus, TTone> = {
  PENDING: 'warn',
  AWAITING_APPROVAL: 'warn',
  PROCESSING: 'warn',
  PROCESSED: 'good',
  FAILED: 'bad',
  CANCELLED: 'muted',
};

const LABEL: Record<string, string> = {
  NOT_APPLICABLE: 'N/A',
  BLOCKED_KYC: 'Held — verify account',
  PARTIALLY_REFUNDED: 'Part refunded',
  PARTIALLY_REVERSED: 'Part reversed',
  AWAITING_APPROVAL: 'Needs approval',
};

function toTitle(value: string): string {
  return LABEL[value] ?? value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

type TStatusBadgeProps =
  | { kind: 'payment'; value: TPaymentStatus }
  | { kind: 'payout'; value: TPayoutStatus }
  | { kind: 'refund'; value: TRefundStatus };

/** State is encoded in colour as well as text so a table scans at a glance. */
export function StatusBadge(props: TStatusBadgeProps) {
  const tone: TTone =
    props.kind === 'payment'
      ? PAYMENT_TONE[props.value]
      : props.kind === 'payout'
        ? PAYOUT_TONE[props.value]
        : REFUND_TONE[props.value];

  return (
    <Badge variant="outline" className={cn('font-medium whitespace-nowrap', TONE_CLASS[tone])}>
      {toTitle(props.value)}
    </Badge>
  );
}
