import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/services/api';
import { utils } from '@/utils';
import type {
  TEntitlementsResponse,
  TSubscriptionOrderResponse,
  TSubscriptionResponse,
} from '../types';
import type { TPayablePlanId } from '../components';

const queryKeys = {
  all: ['plan'] as const,
  entitlements: () => ['plan', 'entitlements'] as const,
  subscription: () => ['plan', 'subscription'] as const,
};

/**
 * Plan, trial countdown, print quota and collection mode in one call.
 *
 * Deliberately a single query rather than four: these four facts are read
 * together on every surface that shows them, and split queries would let the
 * page render a trial badge next to a stale commission rate.
 */
const useGetEntitlements = () =>
  useQuery({
    queryKey: queryKeys.entitlements(),
    queryFn: async () => {
      const { data } = await api.get<TEntitlementsResponse>('/payment/subscription/entitlements');
      return data.data;
    },
  });

const useGetSubscription = () =>
  useQuery({
    queryKey: queryKeys.subscription(),
    queryFn: async () => {
      const { data } = await api.get<TSubscriptionResponse>('/payment/subscription/me');
      return data.data;
    },
  });

const useStartTrial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/payment/subscription/trial');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['client'] });
      toast.success('Your free month has started — you are on the Business plan.');
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

const useSetCollectionMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gatewayCollectionEnabled: boolean) => {
      const { data } = await api.patch<TEntitlementsResponse>('/payment/collection-mode', {
        gatewayCollectionEnabled,
      });
      return data.data;
    },
    onSuccess: (entitlements) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      toast.success(
        entitlements.gatewayCollectionEnabled
          ? 'Customers will now pay online before printing.'
          : 'Customers will now pay you at the counter.'
      );
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

const useCreateSubscriptionOrder = () =>
  useMutation({
    mutationFn: async (plan: TPayablePlanId) => {
      const { data } = await api.post<TSubscriptionOrderResponse>('/payment/subscription/order', {
        plan,
      });
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
      // Earnings and the profile both read the plan, so they go stale too.
      queryClient.invalidateQueries({ queryKey: ['billing'] });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      toast.success('Plan renewal resumed');
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

export const planService = {
  queryKeys,
  useGetEntitlements,
  useGetSubscription,
  useStartTrial,
  useSetCollectionMode,
  useCreateSubscriptionOrder,
  useVerifySubscription,
  useCancelSubscription,
  useResumeSubscription,
};
