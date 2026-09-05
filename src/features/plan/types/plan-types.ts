import type { TApiResponse } from '@/services';

export type TClientPlan = 'FREE' | 'PARTNER' | 'BUSINESS';

export type TSubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

export type TSubscription = {
  id: string;
  plan: TClientPlan;
  status: TSubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  isTrial: boolean;
} | null;

/** Prints consumed against the plan's included allowance. The limit is soft. */
export type TPlanUsage = {
  sheetsUsed: number;
  includedSheets: number | null;
  /** May exceed 1 — going over warns but never blocks a print. */
  ratio: number;
  periodStart: string;
  periodEnd: string;
};

export type TEntitlements = {
  plan: TClientPlan;
  subscription: TSubscription;
  isTrial: boolean;
  trialDaysRemaining: number | null;
  trialAvailable: boolean;
  commissionPercent: number;
  canDisableGateway: boolean;
  gatewayCollectionEnabled: boolean;
  usage: TPlanUsage | null;
};

export type TSubscriptionOrder = {
  paymentId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  razorpayKeyId: string;
  shopName: string;
};

export type TSubscriptionResponse = TApiResponse<TSubscription>;
export type TEntitlementsResponse = TApiResponse<TEntitlements>;
export type TSubscriptionOrderResponse = TApiResponse<TSubscriptionOrder>;
