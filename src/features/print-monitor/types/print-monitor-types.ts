import type { PrintStage, PrinterSupply, ChromiumPrinter, PrintQueueJob } from '@/types/electron';

export type PrinterStatus =
  | 'idle'
  | 'printing'
  | 'error'
  | 'queue_stopped'
  | 'disconnected'
  | 'unknown';

export type PrinterFeedbackState = {
  /** True only when running inside the Electron companion app */
  isElectron: boolean;
  /** Human-readable display name of the default printer (for UI labels only) */
  printerName: string | null;
  /** System/driver name required as deviceName in webContents.print() */
  printerSystemName: string | null;
  /** Mapped printer status */
  printerStatus: PrinterStatus;
  /** Convenience flags derived from printerStatus */
  isIdle: boolean;
  isBusy: boolean;
  isError: boolean;
  /** True when the printer appears in the system printer list and status is not 'unknown' */
  isPrinterConnected: boolean;
  /** Current print stage — 'idle' when no job is in flight */
  currentPrintStage: PrintStage;
  /** Paper supply level 0–100, null if unavailable */
  paperLevel: number | null;
  /** Aggregate ink/toner level 0–100, null if unavailable */
  inkLevel: number | null;
  /** Per-cartridge supply levels (CMYK etc.) */
  supplyLevels: PrinterSupply[];
  /** All system printers detected */
  printerList: ChromiumPrinter[];
  /** OS print spooler queue — only populated if companion app supports getPrintQueue */
  printQueue: PrintQueueJob[];
  /** Timestamp of last successful getDeviceInfo call */
  lastRefreshedAt: Date | null;
  /** True while initial or manual fetch is in progress */
  isLoading: boolean;
  /** Error message from getDeviceInfo / IPC */
  error: string | null;
  /** CUPS-specific error (supply levels may be empty) */
  cupsError: string | null;
  /** True when the printer's PPD advertises two-sided-long-edge (auto-duplex capable) */
  supportsDuplex: boolean;
  /** Manually re-fetch device info and printer list */
  refetch: () => void;
};
