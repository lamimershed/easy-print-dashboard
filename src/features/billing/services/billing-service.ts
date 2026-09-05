import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/services/api';
import { utils } from '@/utils';
import type {
  TBillingPeriod,
  TExportResponse,
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

/** Razorpay Route onboarding payload — snake_case because the gateway is. */
export type TPayoutAccountInput = {
  email: string;
  phone: string;
  legal_business_name: string;
  business_type: string;
  contact_name: string;
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
  stakeholder: { name: string; email: string; pan: string };
  settlements: { account_number: string; ifsc_code: string; beneficiary_name: string };
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
  useGetPayoutAccount,
  useRegisterPayoutAccount,
};
