// Electron companion app API — available only when running inside the Electron shell.
// This file uses `export {}` to be treated as a module, which is required for
// `declare global` to correctly augment the Window type under `moduleDetection: "force"`.

export interface ChromiumPrinter {
  name: string;
  displayName: string;
  description: string;
  /**
   * OS-level printer status from Electron (NOT CUPS IPP state codes):
   *   0 = Idle / Ready
   *   1 = Processing / Printing
   *   2 = Paused
   *   3 = Stopped / Offline  ← cross-check with printer-state-reasons: offline-report
   *   4 = Error
   *   5+ = Unknown
   */
  status: number;
  isDefault: boolean;
  /**
   * CUPS/IPP attributes as key-value strings. Key fields:
   *   printer-state-reasons  — comma-separated reasons; includes 'offline-report' when offline
   *   printer-is-accepting-jobs — 'true' | 'false'
   *   marker-names  — comma-separated cartridge names, e.g. 'CL-746S<Color>,PG-745S<Black>'
   *   marker-levels — comma-separated ink levels 0–100, e.g. '10,0'
   *   marker-types  — comma-separated types, e.g. 'inkCartridge,inkCartridge'
   *   marker-colors — hex colors per cartridge
   */
  options: Record<string, string>;
}

export interface PrinterSupply {
  /** e.g. "PG-745S<Black>", "CL-746S<Color>", "paper-tray-1" */
  name: string;
  type: 'ink' | 'paper' | 'other';
  /** 0–100, null if the printer driver does not report supply levels */
  levelPercent: number | null;
}

/**
 * Authoritative printer connection state from the companion app.
 * Derived by cross-referencing OS status + lpstat/PowerShell + USB presence.
 *
 *   ready         — printer connected, queue idle, ready to print
 *   printing      — actively processing a job
 *   queue_stopped — physically present but CUPS/Windows stopped the queue;
 *                   companion auto-heals on macOS via cupsenable
 *   disconnected  — USB device not found — printer off or unplugged
 *   unknown       — status could not be determined
 */
export type RealStatus = 'ready' | 'printing' | 'queue_stopped' | 'disconnected' | 'unknown';

export interface DeviceInfo {
  /** Default printer with companion-computed realStatus, or null if none found */
  printer: (ChromiumPrinter & { realStatus: RealStatus }) | null;
  supplyLevels: PrinterSupply[];
  /** Set if the CUPS IPP query failed — supply levels may be empty */
  cupsError?: string;
  /** True when the printer's PPD advertises two-sided-long-edge (auto-duplex capable) */
  supportsDuplex: boolean;
}

/**
 * Tracks progress of a single print job through the spooling pipeline.
 *
 * Stage flow:
 *   idle → preparing → spooling → printing → complete
 *                                          → error
 */
export type PrintStage = 'idle' | 'preparing' | 'spooling' | 'printing' | 'complete' | 'error';

export interface PrintResult {
  success: boolean;
  stage: PrintStage;
  /** Human-readable error description, set when success is false */
  error?: string;
  /** Raw Electron errorType string from webContents.print() callback */
  errorCode?: string;
}

/** A single job in the OS print spooler queue */
export interface PrintQueueJob {
  id: string;
  fileName: string;
  status: 'pending';
  createdAt: string;
}

export interface ElectronAPI {
  isElectron: true;
  getPrinters: () => Promise<ChromiumPrinter[]>;
  getDeviceInfo: () => Promise<DeviceInfo>;
  print: (options?: { html?: string; printerName?: string }) => Promise<PrintResult>;
  printFile: (options: {
    fileData: ArrayBuffer;
    fileName: string;
    copies?: number;
    printerName?: string;
    colorMode?: 'color' | 'blackwhite';
    duplex?: 'simplex' | 'longEdge' | 'shortEdge';
    pageRange?: string;
    /** Sheet size the customer was quoted and charged for. */
    paperSize?: 'A4' | 'A3' | 'A5' | 'LETTER' | 'LEGAL';
  }) => Promise<PrintResult>;
  printFileNative: (options: {
    fileData: ArrayBuffer;
    fileName: string;
    copies?: number;
    printerName?: string;
    colorMode?: 'color' | 'blackwhite';
    duplex?: 'simplex' | 'longEdge' | 'shortEdge';
    pageRange?: string;
    /** Sheet size the customer was quoted and charged for. */
    paperSize?: 'A4' | 'A3' | 'A5' | 'LETTER' | 'LEGAL';
  }) => Promise<PrintResult>;
  printHello: () => Promise<boolean>;
  /** Subscribe to stage events emitted by main process during a print job */
  onPrintStage: (cb: (stage: PrintStage) => void) => void;
  /** Unsubscribe a previously registered stage listener */
  offPrintStage: (cb: (stage: PrintStage) => void) => void;

  /** Get pending jobs from the OS print spooler */
  getPrintQueue: () => Promise<PrintQueueJob[]>;
  /** Subscribe to push-based printer status changes (avoids polling) */
  onPrinterStatusChange: (cb: (status: number) => void) => void;
  /** Unsubscribe all printer-status-change listeners */
  offPrinterStatusChange: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
