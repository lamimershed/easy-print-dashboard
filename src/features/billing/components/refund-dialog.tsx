import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { safeRandomUUID } from '@/utils/safe-uuid';
import { billingService } from '../services';
import {
  buildRefundSchema,
  REFUND_REASONS,
  type TRefundFormValues,
} from '../schemas/refund-schema';
import { formatPaise } from '@/utils/format-money';
import type { TPayment, TRefundReason } from '../types';

type TRefundDialogProps = {
  payment: TPayment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RefundDialog({ payment, open, onOpenChange }: TRefundDialogProps) {
  const { data: refundability, isLoading } = billingService.useGetRefundability(
    open ? (payment?.id ?? null) : null
  );
  const createRefund = billingService.useCreateRefund();

  // One key per opening of the dialog: a double-submit or a retry after a
  // timeout returns the original refund instead of making a second one.
  const [idempotencyKey, setIdempotencyKey] = useState(() => safeRandomUUID());
  useEffect(() => {
    if (open) setIdempotencyKey(safeRandomUUID());
  }, [open]);

  const maxPaise = refundability?.refundablePaise ?? 0;
  const schema = useMemo(() => buildRefundSchema(maxPaise), [maxPaise]);

  const form = useForm<TRefundFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mode: 'full', reason: 'CUSTOMER_REQUEST', notes: '', confirmAmount: '' },
  });

  const mode = form.watch('mode');
  const amountRupees = form.watch('amountRupees');

  const typedPaise = Math.round((Number(amountRupees) || 0) * 100);
  const refundPaise = mode === 'full' ? maxPaise : Math.min(typedPaise, maxPaise);

  // Mirrors the server's proportional split so the preview matches what happens.
  const payoutRatio =
    payment && payment.amountPaise > 0 ? payment.payoutAmountPaise / payment.amountPaise : 0;
  const clientSharePaise = Math.round(refundPaise * payoutRatio);
  const platformSharePaise = refundPaise - clientSharePaise;

  const needsApproval =
    refundability !== undefined && refundPaise >= refundability.approvalThresholdPaise;

  useEffect(() => {
    if (!open)
      form.reset({ mode: 'full', reason: 'CUSTOMER_REQUEST', notes: '', confirmAmount: '' });
  }, [open, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (!payment) return;

    createRefund.mutate(
      {
        paymentId: payment.id,
        amountPaise: values.mode === 'full' ? undefined : refundPaise,
        reason: values.reason as TRefundReason,
        notes: values.notes || undefined,
        idempotencyKey,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  });

  const blocked = refundability !== undefined && !refundability.canRefund;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Refund this payment</DialogTitle>
          <DialogDescription>
            {payment?.jobFilename ? `${payment.jobFilename} · ` : ''}
            {payment ? formatPaise(payment.amountPaise) : ''} paid on{' '}
            {payment?.capturedAt ? new Date(payment.capturedAt).toLocaleDateString('en-IN') : '—'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Checking what can be refunded…
          </div>
        )}

        {blocked && refundability && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">Refund not available</span>
              <span className="text-xs opacity-90">{refundability.blockedReason}</span>
            </div>
          </div>
        )}

        {!isLoading && !blocked && refundability && (
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            {/* Refundable, not the original amount */}
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Still refundable
              </span>
              <p className="mt-0.5 text-2xl font-black text-foreground tabular-nums">
                {formatPaise(maxPaise)}
              </p>
              {payment && payment.refundedAmountPaise > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatPaise(payment.refundedAmountPaise)} already refunded
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Amount</Label>
              <div className="flex gap-2">
                {(['full', 'partial'] as const).map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={mode === option ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => form.setValue('mode', option, { shouldValidate: false })}
                  >
                    {option === 'full' ? `Full — ${formatPaise(maxPaise)}` : 'Partial'}
                  </Button>
                ))}
              </div>

              {mode === 'partial' && (
                <div className="flex flex-col gap-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxPaise / 100}
                    placeholder={`Up to ${maxPaise / 100}`}
                    {...form.register('amountRupees')}
                  />
                  {form.formState.errors.amountRupees && (
                    <span className="text-xs text-destructive">
                      {form.formState.errors.amountRupees.message}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Reason</Label>
              <Select
                value={form.watch('reason')}
                onValueChange={(value) => form.setValue('reason', value, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REFUND_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.reason && (
                <span className="text-xs text-destructive">
                  {form.formState.errors.reason.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Notes (optional)</Label>
              <Textarea
                rows={2}
                placeholder="Anything worth recording"
                {...form.register('notes')}
              />
            </div>

            {/* What this actually costs — stated before the button, not after */}
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col gap-1.5 text-xs">
                <p className="text-foreground">
                  You will refund{' '}
                  <span className="font-semibold tabular-nums">{formatPaise(refundPaise)}</span> to
                  the customer.
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatPaise(clientSharePaise)}
                  </span>{' '}
                  comes out of your payout,{' '}
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatPaise(platformSharePaise)}
                  </span>{' '}
                  from the platform commission.
                </p>
                {refundability.nonRefundableFeePaise ? (
                  <p className="text-muted-foreground">
                    The payment gateway fee of{' '}
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatPaise(refundability.nonRefundableFeePaise)}
                    </span>{' '}
                    is not returned.
                  </p>
                ) : null}
                {needsApproval && (
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    This is above {formatPaise(refundability.approvalThresholdPaise)}, so it goes to
                    an admin for approval before it runs.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Type {(refundPaise / 100).toFixed(2)} to confirm</Label>
              <Input
                placeholder={(refundPaise / 100).toFixed(2)}
                {...form.register('confirmAmount')}
              />
              {form.formState.errors.confirmAmount && (
                <span className="text-xs text-destructive">
                  {form.formState.errors.confirmAmount.message}
                </span>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRefund.isPending || refundPaise <= 0}>
                {createRefund.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {needsApproval ? 'Submit for approval' : `Refund ${formatPaise(refundPaise)}`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
