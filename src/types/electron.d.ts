// Electron companion app API — available only when running inside the Electron shell.
// This file uses `export {}` to be treated as a module, which is required for
// `declare global` to correctly augment the Window type under `moduleDetection: "force"`.

export interface ChromiumPrinter {
  name: string;
  displayName: string;
  description: string;
  /** Chromium maps CUPS printer-state: 3=idle, 4=processing/printing, 5=stopped */
  status: number;
  isDefault: boolean;
  options: Record<string, string>;
}

export interface PrinterSupply {
  /** e.g. "cyan", "black", "paper-tray-1" */
  name: string;
  type: 'ink' | 'toner' | 'paper' | 'other';
  /** 0–100, null if the printer driver does not report supply levels */
  levelPercent: number | null;
}

export interface DeviceInfo {
  printer: ChromiumPrinter | null;
  supplyLevels: PrinterSupply[];
  /** Set if the CUPS IPP query failed — supply levels will be empty */
  cupsError?: string;
}

export interface ElectronAPI {
  isElectron: true;
  getPrinters: () => Promise<ChromiumPrinter[]>;
  getDeviceInfo: () => Promise<DeviceInfo>;
  print: (options?: {
    html?: string;
    printerName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  printFile: (options: {
    fileData: ArrayBuffer;
    fileName: string;
    copies?: number;
    printerName?: string;
    colorMode?: 'color' | 'blackwhite';
  }) => Promise<{ success: boolean; error?: string }>;
  printHello: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
