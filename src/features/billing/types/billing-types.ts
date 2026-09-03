import type { TApiPaginatedResponse, TApiResponse } from '@/services';

export type TPaymentStatus =
  | 'CREATED'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'EXPIRED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export type TPayoutStatus =
  | 'NOT_APPLICABLE'
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIALLY_REVERSED'
  | 'REVERSED'
  | 'FAILED'
  | 'BLOCKED_KYC';

export type TRefundStatus =
  | 'PENDING'
  | 'AWAITING_APPROVAL'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FAILED'
  | 'CANCELLED';

export type TRefundReason =
  | 'CUSTOMER_REQUEST'
  | 'PRINT_FAILED'
  | 'PRINTER_OFFLINE'
  | 'SESSION_EXPIRED'
  | 'DUPLICATE_CHARGE'
  | 'QUALITY_ISSUE'
  | 'FRAUD'
  | 'SUBSCRIPTION_CANCELLED'
  | 'ADMIN_ADJUSTMENT';

export type TRefundPolicy = 'PROPORTIONAL' | 'CLIENT_BEARS_ALL' | 'PLATFORM_BEARS_ALL';
export type TPaymentType = 'PRINT_JOB' | 'SUBSCRIPTION';
export type TBillingPeriod = '7d' | '30d' | '90d' | 'all';
export type TRazorpayAccountStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';

export type TPayment = {
  id: string;
  paymentType: TPaymentType;
  amountPaise: number;
  commissionAmountPaise: number;
  payoutAmountPaise: number;
  refundedAmountPaise: number;
  gatewayFeePaise: number | null;
  currency: string;
  status: TPaymentStatus;
  payoutStatus: TPayoutStatus;
  orderId: string | null;
  gatewayId: string | null;
  transferId: string | null;
  method: string | null;
  printJobId: string | null;
  jobFilename: string | null;
  pageCount: number | null;
  copies: number | null;
  capturedAt: string | null;
  createdAt: string;
};

export type TRefund = {
  id: string;
  paymentId: string;
  amountPaise: number;
  clientSharePaise: number;
  platformSharePaise: number;
  currency: string;
  status: TRefundStatus;
  reason: TRefundReason;
  policy: TRefundPolicy;
  initiator: 'CUSTOMER' | 'CLIENT' | 'ADMIN' | 'SYSTEM';
  notes: string | null;
  gatewayRefundId: string | null;
  failureReason: string | null;
  processedAt: string | null;
  createdAt: string;
};

export type TLedgerEntry = {
  id: string;
  account: string;
  direction: 'DEBIT' | 'CREDIT';
  amountPaise: number;
  description: string;
  settlementId: string | null;
  createdAt: string;
};

export type TTimelineEvent = {
  at: string;
  label: string;
  detail: string | null;
};

export type TRefundability = {
  refundablePaise: number;
  canRefund: boolean;
  blockedReason: string | null;
  approvalThresholdPaise: number;
  /** Gateway fee the platform does not get back on a refund. */
  nonRefundableFeePaise: number | null;
  windowClosesAt: string | null;
};

export type TPaymentDetail = TPayment & {
  refunds: TRefund[];
  ledger: TLedgerEntry[];
  timeline: TTimelineEvent[];
  refundability: TRefundability;
};

export type TPayout = {
  paymentId: string;
  amountPaise: number;
  payoutAmountPaise: number;
  payoutStatus: TPayoutStatus;
  transferId: string | null;
  capturedAt: string | null;
  createdAt: string;
};

export type TEarningsPoint = {
  date: string;
  grossPaise: number;
  netPaise: number;
  refundedPaise: number;
  count: number;
};

export type TBillingSummary = {
  period: string;
  grossPaise: number;
  commissionPaise: number;
  netEarningsPaise: number;
  pendingPayoutPaise: number;
  refundedPaise: number;
  gatewayFeePaise: number;
  transactionCount: number;
  refundCount: number;
  blockedPayoutPaise: number;
  series: TEarningsPoint[];
};

export type TSubscription = {
  id: string;
  plan: 'FREE' | 'STARTER' | 'PRO';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
} | null;

export type TPayoutAccount = {
  razorpayAccountId: string | null;
  status: TRazorpayAccountStatus | null;
};

export type TOrderResponse = {
  paymentId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  razorpayKeyId: string;
  shopName: string;
};

export type TPaymentFilters = {
  page?: number;
  limit?: number;
  status?: TPaymentStatus;
  type?: TPaymentType;
  payoutStatus?: TPayoutStatus;
  from?: string;
  to?: string;
  q?: string;
};

export type TSummaryResponse = TApiResponse<TBillingSummary>;
export type TPaymentsResponse = TApiPaginatedResponse<TPayment>;
export type TPaymentDetailResponse = TApiResponse<TPaymentDetail>;
export type TPayoutsResponse = TApiPaginatedResponse<TPayout>;
export type TRefundsResponse = TApiPaginatedResponse<TRefund>;
export type TRefundResponse = TApiResponse<TRefund>;
export type TRefundabilityResponse = TApiResponse<TRefundability>;
export type TSubscriptionResponse = TApiResponse<TSubscription>;
export type TPayoutAccountResponse = TApiResponse<TPayoutAccount>;
export type TOrderApiResponse = TApiResponse<TOrderResponse>;
export type TExportResponse = TApiResponse<TPayment[]>;
