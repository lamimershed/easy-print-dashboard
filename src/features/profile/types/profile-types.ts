import type { TApiResponse } from '@/services';
import type { TClientProfile } from '@/features/auth/types';

export type { TClientProfile };

export type TUpdateClientRequest = {
  companyName?: string;
  phoneNumber?: string;
  logoUrl?: string;
  googleProfileLink?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export type TClientProfileResponse = TApiResponse<TClientProfile>;
export type TUpdateClientResponse = TApiResponse<TClientProfile>;
