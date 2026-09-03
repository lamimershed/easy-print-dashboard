import { z } from 'zod';

export const REFUND_REASONS = [
  { value: 'CUSTOMER_REQUEST', label: 'Customer asked for a refund' },
  { value: 'PRINT_FAILED', label: 'The print failed' },
  { value: 'QUALITY_ISSUE', label: 'Print quality was not acceptable' },
  { value: 'DUPLICATE_CHARGE', label: 'Customer was charged twice' },
  { value: 'PRINTER_OFFLINE', label: 'Printer was offline' },
] as const;

/**
 * `maxPaise` comes from the server's refundability response — the amount *still*
 * refundable, never the original payment amount. A partially refunded payment
 * must not offer the full value again.
 */
export const buildRefundSchema = (maxPaise: number) =>
  z
    .object({
      mode: z.enum(['full', 'partial']),
      // Kept as a string: an <input> yields strings, and coercing in the schema
      // makes the resolver's input type `unknown`.
      amountRupees: z.string().optional(),
      reason: z.enum(REFUND_REASONS.map((r) => r.value) as [string, ...string[]], {
        message: 'Choose a reason',
      }),
      notes: z.string().max(500, 'Keep notes under 500 characters').optional(),
      confirmAmount: z.string().min(1, 'Type the amount to confirm'),
    })
    .superRefine((values, ctx) => {
      const typedRupees = Number(values.amountRupees);
      const amountPaise = values.mode === 'full' ? maxPaise : Math.round((typedRupees || 0) * 100);

      if (values.mode === 'partial') {
        if (!values.amountRupees || Number.isNaN(typedRupees) || typedRupees <= 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['amountRupees'],
            message: 'Enter an amount greater than zero',
          });
          return;
        }
        if (amountPaise > maxPaise) {
          ctx.addIssue({
            code: 'custom',
            path: ['amountRupees'],
            message: `Only ₹${(maxPaise / 100).toFixed(2)} is still refundable`,
          });
          return;
        }
      }

      // Typing the amount is the friction that stops a mis-click from moving money.
      const expected = (amountPaise / 100).toFixed(2);
      const typed = values.confirmAmount.replace(/[₹,\s]/g, '');
      if (typed !== expected && typed !== String(amountPaise / 100)) {
        ctx.addIssue({
          code: 'custom',
          path: ['confirmAmount'],
          message: `Type ${expected} to confirm`,
        });
      }
    });

export type TRefundFormValues = z.infer<ReturnType<typeof buildRefundSchema>>;
