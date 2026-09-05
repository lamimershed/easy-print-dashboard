import { z } from 'zod';

/** Razorpay validates these too, but catching them here saves a round trip. */
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** Mirrors Razorpay's accepted `business_type` values. */
export const BUSINESS_TYPES = [
  { value: 'proprietorship', label: 'Sole proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'private_limited', label: 'Private limited' },
  { value: 'public_limited', label: 'Public limited' },
  { value: 'llp', label: 'LLP' },
  { value: 'individual', label: 'Individual' },
  { value: 'trust', label: 'Trust' },
  { value: 'society', label: 'Society' },
  { value: 'ngo', label: 'NGO' },
  { value: 'huf', label: 'HUF' },
  { value: 'not_yet_registered', label: 'Not yet registered' },
] as const;

const upperCased = (schema: z.ZodString, message: string) =>
  z
    .string()
    .transform((value) => value.toUpperCase().trim())
    .refine((value) => schema.safeParse(value).success, message);

export const payoutAccountSchema = z.object({
  // ── Business ──────────────────────────────────────────────────────────────
  email: z.string().email('Enter a valid business email'),
  phone: z.string().regex(/^[6-9][0-9]{9}$/, 'Enter a valid 10-digit mobile number'),
  legalBusinessName: z.string().min(3, 'Enter the registered business name'),
  businessType: z.enum(BUSINESS_TYPES.map((type) => type.value) as [string, ...string[]], {
    message: 'Pick a business type',
  }),
  contactName: z.string().min(3, 'Enter the primary contact name'),

  // ── Registered address ────────────────────────────────────────────────────
  street1: z.string().min(3, 'Enter the street address'),
  city: z.string().min(2, 'Enter the city'),
  state: z.string().min(2, 'Enter the state'),
  postalCode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit PIN code'),

  // ── Legal ─────────────────────────────────────────────────────────────────
  pan: upperCased(z.string().regex(PAN_PATTERN), 'Enter a valid PAN, e.g. ABCDE1234F'),
  gst: z
    .string()
    .optional()
    .transform((value) => value?.toUpperCase().trim() || undefined)
    .refine((value) => !value || GST_PATTERN.test(value), 'Enter a valid 15-character GSTIN'),

  // ── Stakeholder ───────────────────────────────────────────────────────────
  stakeholderName: z.string().min(3, 'Enter the stakeholder name'),
  stakeholderEmail: z.string().email('Enter a valid email'),
  stakeholderPan: upperCased(z.string().regex(PAN_PATTERN), 'Enter a valid PAN'),

  // ── Settlement bank account ───────────────────────────────────────────────
  accountNumber: z.string().regex(/^[0-9]{5,20}$/, 'Enter a valid bank account number'),
  ifscCode: upperCased(z.string().regex(IFSC_PATTERN), 'Enter a valid IFSC, e.g. HDFC0000053'),
  beneficiaryName: z.string().min(3, 'Enter the name on the bank account'),
});

export type TPayoutAccountFormValues = z.input<typeof payoutAccountSchema>;
export type TPayoutAccountParsed = z.output<typeof payoutAccountSchema>;
