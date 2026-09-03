/**
 * All money crosses the wire in paise. Nothing in the UI ever does arithmetic
 * on rupees — it formats paise at the last moment.
 */
export const formatPaise = (paise: number | null | undefined): string => {
  if (paise === null || paise === undefined) return '—';
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/** Compact form for stat tiles, e.g. ₹1.2L. */
export const formatPaiseCompact = (paise: number): string => {
  const rupees = paise / 100;
  if (rupees >= 10_000_000) return `₹${(rupees / 10_000_000).toFixed(2)}Cr`;
  if (rupees >= 100_000) return `₹${(rupees / 100_000).toFixed(2)}L`;
  if (rupees >= 1_000) return `₹${(rupees / 1_000).toFixed(1)}K`;
  return formatPaise(paise);
};

export const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100);
export const paiseToRupees = (paise: number): number => paise / 100;

export const formatDateTime = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const formatDate = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—';
