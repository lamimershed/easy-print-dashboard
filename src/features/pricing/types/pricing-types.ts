import type { TApiResponse } from '@/services';

export type TPaperSize = 'A4' | 'A3' | 'A5' | 'LETTER' | 'LEGAL';
export type TColorMode = 'blackwhite' | 'color';
export type TAddonKind = 'PER_JOB' | 'PER_COPY' | 'PER_SHEET';
export type TRoundingMode = 'NONE' | 'NEAREST_RUPEE' | 'UP_RUPEE';

export const PAPER_SIZES: Array<{ value: TPaperSize; label: string; hint: string }> = [
  { value: 'A4', label: 'A4', hint: '210 × 297 mm — the everyday size' },
  { value: 'A3', label: 'A3', hint: '297 × 420 mm — posters and drawings' },
  { value: 'A5', label: 'A5', hint: '148 × 210 mm — handouts' },
  { value: 'LETTER', label: 'Letter', hint: '216 × 279 mm' },
  { value: 'LEGAL', label: 'Legal', hint: '216 × 356 mm' },
];

export const COLOR_MODES: Array<{ value: TColorMode; label: string }> = [
  { value: 'blackwhite', label: 'Black & white' },
  { value: 'color', label: 'Colour' },
];

export const ADDON_KINDS: Array<{ value: TAddonKind; label: string; hint: string }> = [
  { value: 'PER_JOB', label: 'Once per order', hint: 'Charged once, however big the job' },
  { value: 'PER_COPY', label: 'Per copy', hint: 'Multiplied by the number of copies' },
  { value: 'PER_SHEET', label: 'Per sheet', hint: 'Multiplied by every printed sheet' },
];

export const ROUNDING_MODES: Array<{ value: TRoundingMode; label: string; hint: string }> = [
  { value: 'NONE', label: 'Exact paise', hint: 'Charge the precise amount' },
  { value: 'NEAREST_RUPEE', label: 'Nearest rupee', hint: '₹10.40 becomes ₹10' },
  { value: 'UP_RUPEE', label: 'Round up', hint: '₹10.40 becomes ₹11' },
];

export type TPriceTier = {
  id?: string;
  minSheets: number;
  pricePerSheetPaise: number;
};

export type TPriceRule = {
  id?: string;
  paperSize: TPaperSize;
  colorMode: TColorMode;
  pricePerSheetPaise: number;
  isActive: boolean;
  tiers: TPriceTier[];
};

export type TPriceAddon = {
  id: string;
  name: string;
  description: string | null;
  kind: TAddonKind;
  pricePaise: number;
  isActive: boolean;
  sortOrder: number;
};

export type TPriceList = {
  id: string;
  version: number;
  minChargePaise: number;
  duplexDiscountPercent: number;
  roundingMode: TRoundingMode;
  rules: TPriceRule[];
  addons: TPriceAddon[];
  updatedBy: string | null;
  updatedAt: string;
};

export type TAppliedAddon = {
  id: string;
  name: string;
  kind: TAddonKind;
  pricePaise: number;
  quantity: number;
  totalPaise: number;
};

export type TPreviewBreakdown = {
  pageCount: number;
  copies: number;
  sheetsPerCopy: number;
  totalSheets: number;
  colorMode: string;
  duplex: string;
  paperSize: TPaperSize;
  perSheetPaise: number;
  tierMinSheets: number | null;
  basePerSheetPaise: number;
  subtotalPaise: number;
  duplexDiscountPaise: number;
  minChargeApplied: boolean;
  printTotalPaise: number;
  addons: TAppliedAddon[];
  addonsTotalPaise: number;
  roundingAdjustmentPaise: number;
  priceListVersion: number;
};

export type TPreviewQuote = {
  totalPaise: number;
  currency: string;
  commissionPaise: number;
  payoutPaise: number;
  breakdown: TPreviewBreakdown;
};

export type TPreviewInput = {
  pageCount: number;
  copies: number;
  paperSize?: TPaperSize;
  colorMode?: TColorMode;
  duplex?: 'simplex' | 'longEdge' | 'shortEdge';
  addonIds?: string[];
};

export type TPriceRevision = {
  id: string;
  version: number;
  changedBy: string;
  summary: string | null;
  createdAt: string;
  snapshot: unknown;
};

export type TPriceListResponse = TApiResponse<TPriceList>;
export type TPreviewResponse = TApiResponse<TPreviewQuote>;
export type TRevisionsResponse = TApiResponse<TPriceRevision[]>;
