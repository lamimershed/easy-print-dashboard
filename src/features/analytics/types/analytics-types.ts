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

export type TPaginatedAnalyticsEvents = {
  data: TAnalyticsEvent[];
  total: number;
  page: number;
  limit: number;
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

export type TPaginatedPrintJobs = {
  data: TPrintJob[];
  total: number;
  page: number;
  limit: number;
};

export type TAnalyticsPeriod = '7d' | '30d' | 'all';
