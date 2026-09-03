import { z } from 'zod';

/** Razorpay validates these too, but catching them here saves a round trip. */
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/;

export const payoutAccountSchema = z.object({
  email: z.string().email('Enter a valid business email'),
  street1: z.string().min(3, 'Enter the street address'),
  city: z.string().min(2, 'Enter the city'),
  state: z.string().min(2, 'Enter the state'),
  postalCode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit PIN code'),
  pan: z
    .string()
    .transform((value) => value.toUpperCase().trim())
    .refine((value) => PAN_PATTERN.test(value), 'Enter a valid PAN, e.g. ABCDE1234F'),
  gst: z
    .string()
    .optional()
    .transform((value) => value?.toUpperCase().trim() || undefined)
    .refine((value) => !value || GST_PATTERN.test(value), 'Enter a valid 15-character GSTIN'),
});

export type TPayoutAccountFormValues = z.input<typeof payoutAccountSchema>;
export type TPayoutAccountParsed = z.output<typeof payoutAccountSchema>;
