import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/services/api';
import { utils } from '@/utils';
import type {
  TBillingPeriod,
  TExportResponse,
  TOrderApiResponse,
  TPayment,
  TPaymentDetailResponse,
  TPaymentFilters,
  TPaymentsResponse,
  TPayoutAccountResponse,
  TPayoutStatus,
  TPayoutsResponse,
  TRefundPolicy,
  TRefundReason,
  TRefundResponse,
  TRefundStatus,
  TRefundabilityResponse,
  TRefundsResponse,
  TSubscriptionResponse,
  TSummaryResponse,
} from '../types';

const queryKeys = {
  all: ['billing'] as const,
  summary: (period: TBillingPeriod) => ['billing', 'summary', period] as const,
  payments: (filters: TPaymentFilters) => ['billing', 'payments', filters] as const,
  payment: (id: string) => ['billing', 'payment', id] as const,
  refundability: (id: string) => ['billing', 'refundability', id] as const,
  payouts: (page: number, limit: number, status?: TPayoutStatus) =>
    ['billing', 'payouts', page, limit, status] as const,
  refunds: (page: number, limit: number, status?: TRefundStatus) =>
    ['billing', 'refunds', page, limit, status] as const,
  subscription: () => ['billing', 'subscription'] as const,
  payoutAccount: () => ['billing', 'payout-account'] as const,
};

const useGetSummary = (period: TBillingPeriod = '30d') =>
  useQuery({
    queryKey: queryKeys.summary(period),
    queryFn: async () => {
      const { data } = await api.get<TSummaryResponse>('/payment/summary', { params: { period } });
      return data.data;
    },
    staleTime: 60 * 1000,
  });

const useGetPayments = (filters: TPaymentFilters) =>
  useQuery({
    queryKey: queryKeys.payments(filters),
    queryFn: async () => {
      const { data } = await api.get<TPaymentsResponse>('/payment/history', { params: filters });
      return { data: data.data, meta: data.meta };
    },
  });

const useGetPayment = (id: string | null) =>
  useQuery({
    queryKey: queryKeys.payment(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<TPaymentDetailResponse>(`/payment/${id}`);
      return data.data;
    },
  });

/** Drives the refund dialog: what's left, what it costs, and why it may be blocked. */
const useGetRefundability = (id: string | null) =>
  useQuery({
    queryKey: queryKeys.refundability(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<TRefundabilityResponse>(`/payment/${id}/refundability`);
      return data.data;
    },
  });

const useGetPayouts = (page = 1, limit = 20, status?: TPayoutStatus) =>
  useQuery({
    queryKey: queryKeys.payouts(page, limit, status),
    queryFn: async () => {
      const { data } = await api.get<TPayoutsResponse>('/payment/payouts', {
        params: { page, limit, ...(status ? { status } : {}) },
      });
      return { data: data.data, meta: data.meta };
    },
  });

const useGetRefunds = (page = 1, limit = 20, status?: TRefundStatus) =>
  useQuery({
    queryKey: queryKeys.refunds(page, limit, status),
    queryFn: async () => {
      const { data } = await api.get<TRefundsResponse>('/payment/refunds', {
        params: { page, limit, ...(status ? { status } : {}) },
      });
      return { data: data.data, meta: data.meta };
    },
  });

export type TCreateRefundInput = {
  paymentId: string;
  amountPaise?: number;
  reason: TRefundReason;
  notes?: string;
  policy?: TRefundPolicy;
  /** Generated when the dialog opens so a double-submit returns the same refund. */
  idempotencyKey: string;
};

const useCreateRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, idempotencyKey, ...body }: TCreateRefundInput) => {
      const { data } = await api.post<TRefundResponse>(`/payment/${paymentId}/refunds`, body, {
        headers: { 'Idempotency-Key': idempotencyKey },
      });
      return data.data;
    },
    onSuccess: (refund) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      toast.success(
        refund.status === 'AWAITING_APPROVAL'
          ? 'Refund submitted for admin approval'
          : 'Refund started — it reaches the customer in 5–7 working days'
      );
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

/** Returns the full filtered set — the caller writes it to a spreadsheet. */
const useExportPayments = () =>
  useMutation({
    mutationFn: async (filters: TPaymentFilters): Promise<TPayment[]> => {
      const { data } = await api.get<TExportResponse>('/payment/export', { params: filters });
      return data.data;
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });

// ── Subscription ────────────────────────────────────────────────────────────

const useGetSubscription = () =>
  useQuery({
    queryKey: queryKeys.subscription(),
    queryFn: async () => {
      const { data } = await api.get<TSubscriptionResponse>('/payment/subscription/me');
      return data.data;
    },
  });

const useCreateSubscriptionOrder = () =>
  useMutation({
    mutationFn: async (plan: 'STARTER' | 'PRO') => {
      const { data } = await api.post<TOrderApiResponse>('/payment/subscription/order', { plan });
      return data.data;
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });

const useVerifySubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      const { data } = await api.post('/payment/subscription/verify', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['client'] });
      toast.success('Plan updated');
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/payment/subscription/cancel');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription() });
      toast.success('Plan will end at the close of the current period');
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

const useResumeSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/payment/subscription/resume');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription() });
      toast.success('Plan renewal resumed');
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

// ── Payout account (Razorpay Route onboarding) ──────────────────────────────

export type TPayoutAccountInput = {
  email: string;
  profile: {
    category: string;
    subcategory: string;
    addresses: {
      registered: {
        street1: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
    };
  };
  legal_info: { pan: string; gst?: string };
};

const useGetPayoutAccount = () =>
  useQuery({
    queryKey: queryKeys.payoutAccount(),
    queryFn: async () => {
      const { data } = await api.get<TPayoutAccountResponse>('/clients/me/razorpay-account');
      return data.data;
    },
  });

const useRegisterPayoutAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TPayoutAccountInput) => {
      const { data } = await api.post<TPayoutAccountResponse>(
        '/clients/me/razorpay-account',
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payoutAccount() });
      toast.success('Payout account submitted for verification');
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

export const billingService = {
  queryKeys,
  useGetSummary,
  useGetPayments,
  useGetPayment,
  useGetRefundability,
  useGetPayouts,
  useGetRefunds,
  useCreateRefund,
  useExportPayments,
  useGetSubscription,
  useCreateSubscriptionOrder,
  useVerifySubscription,
  useCancelSubscription,
  useResumeSubscription,
  useGetPayoutAccount,
  useRegisterPayoutAccount,
};
