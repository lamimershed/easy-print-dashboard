import { useEffect, useState } from 'react';
import type { PrinterSupply } from '@/types/electron';

export type PrinterStatus = 'idle' | 'printing' | 'error' | 'unknown';

export interface ElectronPrinterState {
  /** True only when the dashboard is running inside the Electron companion app */
  isElectron: boolean;
  /** Display name of the OS default printer */
  printerName: string | null;
  /** Mapped status of the default printer */
  printerStatus: PrinterStatus;
  /** Paper level 0–100, null if unsupported */
  paperLevel: number | null;
  /** Ink/toner level 0–100, null if unsupported */
  inkLevel: number | null;
  /** Per-cartridge supply levels (CMYK etc.) */
  supplyLevels: PrinterSupply[];
  /** True while the initial fetch is in progress */
  isLoading: boolean;
  /** Error message if the IPC call failed */
  error: string | null;
  /** Re-fetch device info on demand */
  refetch: () => void;
}

function mapChromeStatus(status: number): PrinterStatus {
  // Chromium maps CUPS printer-state: 3 = idle, 4 = processing/printing, 5 = stopped
  if (status === 3) return 'idle';
  if (status === 4) return 'printing';
  if (status === 5) return 'error';
  return 'unknown';
}

const POLL_INTERVAL_MS = 30_000; // re-fetch every 30 s

export function useElectronPrinter(): ElectronPrinterState {
  const [state, setState] = useState<Omit<ElectronPrinterState, 'isElectron' | 'refetch'>>({
    printerName: null,
    printerStatus: 'unknown',
    paperLevel: null,
    inkLevel: null,
    supplyLevels: [],
    isLoading: true,
    error: null,
  });

  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron === true;

  const fetchDeviceInfo = async () => {
    if (!isElectron) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      // Prefer getDeviceInfo (Phase 2 — CUPS IPP supply levels)
      if (typeof window.electronAPI!.getDeviceInfo === 'function') {
        const info = await window.electronAPI!.getDeviceInfo();
        const printer = info.printer;

        // Find aggregated paper + ink levels from supply list
        const paperSupply = info.supplyLevels.find((s) => s.type === 'paper');
        const inkSupply = info.supplyLevels.find((s) => s.type === 'ink' || s.type === 'toner');

        setState({
          printerName: printer?.displayName ?? printer?.name ?? null,
          printerStatus: printer ? mapChromeStatus(printer.status) : 'unknown',
          paperLevel: paperSupply?.levelPercent ?? null,
          inkLevel: inkSupply?.levelPercent ?? null,
          supplyLevels: info.supplyLevels,
          isLoading: false,
          error: info.cupsError ?? null,
        });
      } else {
        // Phase 1 fallback — basic printer list only
        const printers = await window.electronAPI!.getPrinters();
        const defaultPrinter = printers.find((p) => p.isDefault) ?? printers[0] ?? null;

        setState({
          printerName: defaultPrinter?.displayName ?? defaultPrinter?.name ?? null,
          printerStatus: defaultPrinter ? mapChromeStatus(defaultPrinter.status) : 'unknown',
          paperLevel: null,
          inkLevel: null,
          supplyLevels: [],
          isLoading: false,
          error: null,
        });
      }
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to get device info',
      }));
    }
  };

  useEffect(() => {
    if (!isElectron) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    fetchDeviceInfo();

    const interval = setInterval(fetchDeviceInfo, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isElectron,
    ...state,
    refetch: fetchDeviceInfo,
  };
}
