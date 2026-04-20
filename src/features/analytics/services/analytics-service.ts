import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type {
  TAnalyticsSummaryResponse,
  TAnalyticsEventsResponse,
  TPrintJobsResponse,
  TAnalyticsPeriod,
} from '../types';

const queryKeys = {
  all: ['analytics'] as const,
  summary: (period: TAnalyticsPeriod) => ['analytics', 'summary', period] as const,
  events: (page: number, limit: number, eventType?: string) =>
    ['analytics', 'events', page, limit, eventType] as const,
  printJobs: (page: number, limit: number, status?: string) =>
    ['analytics', 'printJobs', page, limit, status] as const,
};

const useGetSummary = (period: TAnalyticsPeriod = '30d') =>
  useQuery({
    queryKey: queryKeys.summary(period),
    queryFn: async () => {
      const { data } = await api.get<TAnalyticsSummaryResponse>('/analytics/me', {
        params: { period },
      });
      return data.data;
    },
    staleTime: 60 * 1000,
  });

const useGetEvents = (page = 1, limit = 20, eventType?: string) =>
  useQuery({
    queryKey: queryKeys.events(page, limit, eventType),
    queryFn: async () => {
      const { data } = await api.get<TAnalyticsEventsResponse>('/analytics/me/events', {
        params: { page, limit, ...(eventType ? { eventType } : {}) },
      });
      return { data: data.data, meta: data.meta };
    },
  });

const useGetPrintJobs = (page = 1, limit = 20, status?: string) =>
  useQuery({
    queryKey: queryKeys.printJobs(page, limit, status),
    queryFn: async () => {
      const { data } = await api.get<TPrintJobsResponse>('/print-jobs/me', {
        params: { page, limit, ...(status ? { status } : {}) },
      });
      return { data: data.data, meta: data.meta };
    },
  });

export const analyticsService = {
  queryKeys,
  useGetSummary,
  useGetEvents,
  useGetPrintJobs,
};
