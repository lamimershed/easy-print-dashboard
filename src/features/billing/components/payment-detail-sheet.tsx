import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { RotateCcw } from 'lucide-react';
import { billingService } from '../services';
import { StatusBadge } from './status-badge';
import { formatDateTime, formatPaise } from '@/utils/format-money';
import type { TPayment } from '../types';

type TPaymentDetailSheetProps = {
  paymentId: string | null;
  onOpenChange: (open: boolean) => void;
  onRefund: (payment: TPayment) => void;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate text-right text-xs font-medium text-foreground tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function PaymentDetailSheet({
  paymentId,
  onOpenChange,
  onRefund,
}: TPaymentDetailSheetProps) {
  const { data: payment, isLoading } = billingService.useGetPayment(paymentId);

  return (
    <Sheet open={Boolean(paymentId)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Payment detail</SheetTitle>
          <SheetDescription>
            {payment?.jobFilename ?? payment?.paymentType ?? 'Loading…'}
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="flex flex-col gap-3 px-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {payment && (
          <div className="flex flex-col gap-5 px-4 pb-8">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black tabular-nums">
                  {formatPaise(payment.amountPaise)}
                </span>
                <StatusBadge kind="payment" value={payment.status} />
              </div>
              <div className="mt-3">
                <Row
                  label="Platform commission"
                  value={formatPaise(payment.commissionAmountPaise)}
                />
                <Row label="Your earnings" value={formatPaise(payment.payoutAmountPaise)} />
                {payment.refundedAmountPaise > 0 && (
                  <Row label="Refunded" value={formatPaise(payment.refundedAmountPaise)} />
                )}
                {payment.gatewayFeePaise !== null && (
                  <Row label="Gateway fee" value={formatPaise(payment.gatewayFeePaise)} />
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Job
              </h4>
              <Row label="File" value={payment.jobFilename ?? '—'} />
              <Row
                label="Pages × copies"
                value={payment.pageCount ? `${payment.pageCount} × ${payment.copies ?? 1}` : '—'}
              />
              <Row label="Method" value={payment.method ?? '—'} />
              <Row
                label="Payout"
                value={<StatusBadge kind="payout" value={payment.payoutStatus} />}
              />
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Timeline
              </h4>
              <ol className="flex flex-col gap-3">
                {payment.timeline.map((event, i) => (
                  <li key={`${event.label}-${i}`} className="flex gap-3">
                    <div className="mt-1 flex flex-col items-center">
                      <span className="size-2 rounded-full bg-primary" />
                      {i < payment.timeline.length - 1 && (
                        <span className="mt-1 h-full w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="flex flex-col pb-1">
                      <span className="text-xs font-medium text-foreground">{event.label}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTime(event.at)}
                        {event.detail ? ` · ${event.detail}` : ''}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {payment.refunds.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Refunds
                  </h4>
                  <div className="flex flex-col gap-2">
                    {payment.refunds.map((refund) => (
                      <div
                        key={refund.id}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold tabular-nums">
                            {formatPaise(refund.amountPaise)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {refund.reason.toLowerCase().replace(/_/g, ' ')}
                          </span>
                        </div>
                        <StatusBadge kind="refund" value={refund.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div>
              <h4 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                References
              </h4>
              <Row label="Payment id" value={payment.id} />
              <Row label="Order" value={payment.orderId ?? '—'} />
              <Row label="Gateway payment" value={payment.gatewayId ?? '—'} />
              <Row label="Transfer" value={payment.transferId ?? '—'} />
            </div>

            {payment.refundability.canRefund ? (
              <Button onClick={() => onRefund(payment)} variant="outline" className="w-full">
                <RotateCcw className="mr-2 size-4" />
                Refund {formatPaise(payment.refundability.refundablePaise)}
              </Button>
            ) : (
              payment.refundability.blockedReason && (
                <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  {payment.refundability.blockedReason}
                </p>
              )
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
