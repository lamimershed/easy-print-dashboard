import type { TApiResponse, TApiPaginatedResponse, TPaginatedResult } from '@/services';

export type TAnalyticsSummary = {
  totalScans: number;
  totalPrintJobs: number;
  completedPrintJobs: number;
  failedPrintJobs: number;
  uniqueCustomers: number;
  period: '7d' | '30d' | 'all';
};

export type TAnalyticsEvent = {
  id: string;
  eventType: string;
  metadata: unknown;
  createdAt: string;
};

export type TPrintJob = {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  copies: number;
  colorMode: string;
  tempUserId: string | null;
  status: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt: string | null;
};

export type TAnalyticsPeriod = '7d' | '30d' | 'all';

// Paginated result shapes (what services return to components)
export type TPaginatedAnalyticsEvents = TPaginatedResult<TAnalyticsEvent>;
export type TPaginatedPrintJobs = TPaginatedResult<TPrintJob>;

// API response types (used in service call type annotations)
export type TAnalyticsSummaryResponse = TApiResponse<TAnalyticsSummary>;
export type TAnalyticsEventsResponse = TApiPaginatedResponse<TAnalyticsEvent>;
export type TPrintJobsResponse = TApiPaginatedResponse<TPrintJob>;
