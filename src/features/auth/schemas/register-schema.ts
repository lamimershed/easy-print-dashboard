import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  companyName: z.string().min(1, 'Company name is required').max(100),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+[1-9]\d{1,14}$/, 'Use international format e.g. +1234567890'),
  logoUrl: z.url('Invalid URL — please upload a logo'),
  googleProfileLink: z.url().or(z.literal('')),
  address: z.string().min(1, 'Address is required').max(255),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type TRegisterFormValues = z.infer<typeof registerSchema>;
