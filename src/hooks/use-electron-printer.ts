import { useEffect, useState } from 'react';
import type { PrinterSupply } from '@/types/electron';

export type PrinterStatus =
  | 'idle'
  | 'printing'
  | 'error'
  | 'queue_stopped'
  | 'disconnected'
  | 'unknown';

export interface ElectronPrinterState {
  /** True only when the dashboard is running inside the Electron companion app */
  isElectron: boolean;
  /** Human-readable display name of the OS default printer (for UI only) */
  printerName: string | null;
  /** System/driver name used as deviceName in webContents.print() */
  printerSystemName: string | null;
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
  /** IPC-level error message (companion app unreachable, crash, etc.) */
  error: string | null;
  /** CUPS supply-query diagnostic — set when supply levels can't be fetched but printer itself is reachable */
  cupsError: string | null;
  /** Re-fetch device info on demand */
  refetch: () => void;
}

// Map companion's authoritative realStatus string to PrinterStatus.
// Falls back to reading OS status number + options when realStatus is absent
// (e.g. older companion versions that predate the realStatus field).
function resolvePrinterStatus(
  realStatus: string | undefined,
  status: number,
  options?: Record<string, string>
): PrinterStatus {
  // Primary: use companion-computed realStatus
  if (realStatus) {
    const map: Record<string, PrinterStatus> = {
      ready: 'idle',
      printing: 'printing',
      queue_stopped: 'queue_stopped',
      disconnected: 'disconnected',
      unknown: 'unknown',
    };
    return map[realStatus] ?? 'unknown';
  }

  // Fallback: derive from OS status code + CUPS options
  if (status < 0) return 'disconnected';
  const stateReasons =
    options?.['printer-state-reasons'] ?? options?.['printer-state-reason'] ?? '';
  if (stateReasons.includes('offline-report') || status === 3) return 'disconnected';
  if (options?.['printer-is-accepting-jobs'] === 'false') return 'disconnected';
  if (status === 0 || status === 2) return 'idle';
  if (status === 1) return 'printing';
  if (status === 4) return 'error';
  return 'unknown';
}

// Parse ink/toner supply levels from printer options marker fields.
// These are always populated by the OS driver — no CUPS IPP needed.
function parseMarkerSupplyLevels(options: Record<string, string>): PrinterSupply[] {
  const names = options['marker-names']?.split(',') ?? [];
  const levels = options['marker-levels']?.split(',').map(Number) ?? [];
  const types = options['marker-types']?.split(',') ?? [];
  if (names.length === 0) return [];
  return names.map((rawName, i): PrinterSupply => {
    const typeStr = (types[i] ?? '').trim().toLowerCase();
    const type: PrinterSupply['type'] =
      typeStr.includes('toner') || typeStr.includes('ink') ? 'ink' : 'other';
    const level = levels[i];
    return {
      name: rawName.trim(),
      type,
      levelPercent: isNaN(level) ? null : Math.max(0, Math.min(100, level)),
    };
  });
}

const POLL_INTERVAL_MS = 30_000; // re-fetch every 30 s

export function useElectronPrinter(): ElectronPrinterState {
  const [state, setState] = useState<Omit<ElectronPrinterState, 'isElectron' | 'refetch'>>({
    printerName: null,
    printerSystemName: null,
    printerStatus: 'unknown',
    paperLevel: null,
    inkLevel: null,
    supplyLevels: [],
    isLoading: true,
    error: null,
    cupsError: null,
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

        // Use CUPS IPP supply levels when available; fall back to marker fields in
        // printer.options which are always populated by the OS driver without IPP.
        const supplyLevels =
          info.supplyLevels.length > 0
            ? info.supplyLevels
            : printer?.options
              ? parseMarkerSupplyLevels(printer.options)
              : [];

        const paperSupply = supplyLevels.find((s) => s.type === 'paper');
        const inkSupply = supplyLevels.find((s) => s.type === 'ink');

        setState({
          printerName: printer?.displayName ?? printer?.name ?? null,
          printerSystemName: printer?.name ?? null,
          printerStatus: printer
            ? resolvePrinterStatus(printer.realStatus, printer.status, printer.options)
            : 'disconnected',
          paperLevel: paperSupply?.levelPercent ?? null,
          inkLevel: inkSupply?.levelPercent ?? null,
          supplyLevels,
          isLoading: false,
          error: null,
          cupsError: info.cupsError ?? null,
        });
      } else {
        // Phase 1 fallback — basic printer list only; use marker data for ink levels
        const printers = await window.electronAPI!.getPrinters();
        const defaultPrinter = printers.find((p) => p.isDefault) ?? printers[0] ?? null;
        const supplyLevels = defaultPrinter?.options
          ? parseMarkerSupplyLevels(defaultPrinter.options)
          : [];
        const inkSupply = supplyLevels.find((s) => s.type === 'ink');

        setState({
          printerName: defaultPrinter?.displayName ?? defaultPrinter?.name ?? null,
          printerSystemName: defaultPrinter?.name ?? null,
          printerStatus: defaultPrinter
            ? resolvePrinterStatus(undefined, defaultPrinter.status, defaultPrinter.options)
            : 'disconnected',
          paperLevel: null,
          inkLevel: inkSupply?.levelPercent ?? null,
          supplyLevels,
          isLoading: false,
          error: null,
          cupsError: null,
        });
      }
    } catch (err) {
      setState((s) => ({
        ...s,
        printerStatus: 'error',
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to get device info',
        cupsError: null,
      }));
    }
  };

  useEffect(() => {
    if (!isElectron) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    fetchDeviceInfo();

    if (typeof window.electronAPI!.onPrinterStatusChange === 'function') {
      window.electronAPI!.onPrinterStatusChange((status) => {
        setState((s) => ({ ...s, printerStatus: resolvePrinterStatus(undefined, status) }));
      });
    }

    const interval = setInterval(fetchDeviceInfo, POLL_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      if (typeof window.electronAPI!.offPrinterStatusChange === 'function') {
        window.electronAPI!.offPrinterStatusChange();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isElectron,
    ...state,
    refetch: fetchDeviceInfo,
  };
}
