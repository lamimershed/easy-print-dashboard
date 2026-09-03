import { useState } from 'react';
import { PaymentDetailSheet, RefundDialog, TransactionsTable } from '../components';
import type { TPayment } from '../types';

export function TransactionsTab() {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<TPayment | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <TransactionsTable onSelect={setDetailId} onRefund={setRefundTarget} />

      <PaymentDetailSheet
        paymentId={detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        onRefund={(payment) => {
          setDetailId(null);
          setRefundTarget(payment);
        }}
      />

      <RefundDialog
        payment={refundTarget}
        open={Boolean(refundTarget)}
        onOpenChange={(open) => !open && setRefundTarget(null)}
      />
    </div>
  );
}
