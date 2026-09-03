import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/services/api';
import { utils } from '@/utils';
import type {
  TAddonKind,
  TPreviewInput,
  TPreviewResponse,
  TPriceListResponse,
  TPriceRule,
  TRevisionsResponse,
  TRoundingMode,
} from '../types';

const queryKeys = {
  all: ['pricing'] as const,
  list: () => ['pricing', 'list'] as const,
  preview: (input: TPreviewInput) => ['pricing', 'preview', input] as const,
  revisions: () => ['pricing', 'revisions'] as const,
};

const useGetPriceList = () =>
  useQuery({
    queryKey: queryKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<TPriceListResponse>('/clients/me/pricing');
      return data.data;
    },
    staleTime: 60 * 1000,
  });

/** Every save invalidates the quote caches too — prices changed. */
const invalidateAll = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.all });
  queryClient.invalidateQueries({ queryKey: ['billing'] });
  queryClient.invalidateQueries({ queryKey: ['client'] });
};

const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      minChargePaise: number;
      duplexDiscountPercent: number;
      roundingMode: TRoundingMode;
    }) => {
      const { data } = await api.put<TPriceListResponse>('/clients/me/pricing/settings', payload);
      return data.data;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Pricing settings saved');
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

const useUpdateRules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rules: TPriceRule[]) => {
      const { data } = await api.put<TPriceListResponse>('/clients/me/pricing/rules', {
        rules: rules.map((rule) => ({
          paperSize: rule.paperSize,
          colorMode: rule.colorMode,
          pricePerSheetPaise: rule.pricePerSheetPaise,
          isActive: rule.isActive,
          tiers: rule.tiers.map((tier) => ({
            minSheets: tier.minSheets,
            pricePerSheetPaise: tier.pricePerSheetPaise,
          })),
        })),
      });
      return data.data;
    },
    onSuccess: (list) => {
      invalidateAll(queryClient);
      toast.success(`Prices saved — version ${list.version}`);
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

const useCreateAddon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      kind: TAddonKind;
      pricePaise: number;
    }) => {
      const { data } = await api.post<TPriceListResponse>('/clients/me/pricing/addons', payload);
      return data.data;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Extra added');
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

const useUpdateAddon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      addonId,
      ...payload
    }: {
      addonId: string;
      name?: string;
      description?: string;
      kind?: TAddonKind;
      pricePaise?: number;
      isActive?: boolean;
    }) => {
      const { data } = await api.patch<TPriceListResponse>(
        `/clients/me/pricing/addons/${addonId}`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Extra updated');
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

const useRemoveAddon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addonId: string) => {
      const { data } = await api.delete<TPriceListResponse>(
        `/clients/me/pricing/addons/${addonId}`
      );
      return data.data;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success('Extra retired — orders that already bought it are unaffected');
    },
    onError: (error) => toast.error(utils.getApiResponseError(error)),
  });
};

/**
 * Live calculator. Hits the same engine the customer does, so what the shop
 * owner sees here is exactly what will be charged.
 */
const usePreview = (input: TPreviewInput, enabled = true) =>
  useQuery({
    queryKey: queryKeys.preview(input),
    enabled: enabled && input.pageCount > 0 && input.copies > 0,
    retry: false,
    queryFn: async () => {
      const { data } = await api.post<TPreviewResponse>('/clients/me/pricing/preview', input);
      return data.data;
    },
  });

const useGetRevisions = () =>
  useQuery({
    queryKey: queryKeys.revisions(),
    queryFn: async () => {
      const { data } = await api.get<TRevisionsResponse>('/clients/me/pricing/revisions');
      return data.data;
    },
  });

export const pricingService = {
  queryKeys,
  useGetPriceList,
  useUpdateSettings,
  useUpdateRules,
  useCreateAddon,
  useUpdateAddon,
  useRemoveAddon,
  usePreview,
  useGetRevisions,
};
