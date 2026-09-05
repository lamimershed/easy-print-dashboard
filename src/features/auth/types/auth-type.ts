import type { TApiResponse } from '@/services';
import type { TAuthUserRole } from '@/stores/auth-store';

export type { TAuthUserRole };

export type TClientProfile = {
  id: string;
  slug: string;
  companyName: string;
  phoneNumber: string;
  plan: 'FREE' | 'PARTNER' | 'BUSINESS';
  logoUrl: string | null;
  googleProfileLink: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
};

export type TAuthUser = {
  id: string;
  email: string;
  role: TAuthUserRole;
  client?: TClientProfile;
};

export type TAuthResponse = {
  accessToken: string;
  user: TAuthUser;
};

export type TAuthApiResponse = TApiResponse<TAuthResponse>;
export type TAuthUserApiResponse = TApiResponse<TAuthUser>;

export type TRegisterRequest = {
  email: string;
  password: string;
  companyName: string;
  phoneNumber: string;
  logoUrl: string;
  googleProfileLink?: string;
  address: string;
  latitude?: number;
  longitude?: number;
};

export type TLoginRequest = {
  email: string;
  password: string;
};
