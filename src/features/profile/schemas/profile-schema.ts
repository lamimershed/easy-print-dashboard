import { z } from 'zod';

export const profileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(100),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+[1-9]\d{1,14}$/, 'Use international format e.g. +1234567890'),
  address: z.string().max(255).optional().or(z.literal('')),
  googleProfileLink: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type TProfileFormValues = z.infer<typeof profileSchema>;
