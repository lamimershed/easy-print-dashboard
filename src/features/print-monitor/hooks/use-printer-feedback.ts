import { useEffect, useRef, useState, useCallback } from 'react';
import type { PrintStage, PrintQueueJob, PrinterSupply } from '@/types/electron';
import type { PrinterFeedbackState, PrinterStatus } from '../types';

const POLL_IDLE_MS = 30_000;
const POLL_ACTIVE_MS = 5_000;

// Map companion's authoritative realStatus string to PrinterStatus.
// Falls back to reading OS status number + options when realStatus is absent.
function resolvePrinterStatus(
  realStatus: string | undefined,
  status: number,
  options?: Record<string, string>
): PrinterStatus {
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

  // Fallback for older companion versions
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
  return names.map((rawName, i) => {
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

type InternalState = Omit<
  PrinterFeedbackState,
  'isElectron' | 'isIdle' | 'isBusy' | 'isError' | 'isPrinterConnected' | 'refetch'
>;

export function usePrinterFeedback(): PrinterFeedbackState {
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron === true;

  const [state, setState] = useState<InternalState>({
    printerName: null,
    printerSystemName: null,
    printerStatus: 'unknown',
    currentPrintStage: 'idle',
    paperLevel: null,
    inkLevel: null,
    supplyLevels: [],
    printerList: [],
    printQueue: [],
    lastRefreshedAt: null,
    supportsDuplex: false,
    isLoading: true,
    error: null,
    cupsError: null,
  });

  const currentStageRef = useRef<PrintStage>('idle');

  const fetchDeviceInfo = useCallback(async () => {
    if (!isElectron) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const [deviceInfo, printers] = await Promise.all([
        window.electronAPI!.getDeviceInfo(),
        window.electronAPI!.getPrinters(),
      ]);

      // Optionally fetch the print queue if the companion app supports it
      let printQueue: PrintQueueJob[] = [];
      if (typeof window.electronAPI!.getPrintQueue === 'function') {
        try {
          printQueue = await window.electronAPI!.getPrintQueue!();
        } catch {
          // getPrintQueue is optional — silently ignore
        }
      }

      const printer = deviceInfo.printer;

      // Use CUPS IPP supply levels when available; fall back to marker fields in
      // printer.options which are always populated by the OS driver without IPP.
      const supplyLevels =
        deviceInfo.supplyLevels.length > 0
          ? deviceInfo.supplyLevels
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
        currentPrintStage: currentStageRef.current,
        paperLevel: paperSupply?.levelPercent ?? null,
        inkLevel: inkSupply?.levelPercent ?? null,
        supplyLevels,
        printerList: printers,
        printQueue,
        supportsDuplex: deviceInfo.supportsDuplex ?? false,
        lastRefreshedAt: new Date(),
        isLoading: false,
        error: null,
        cupsError: deviceInfo.cupsError ?? null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        printerStatus: 'error',
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to get device info',
        cupsError: null,
      }));
    }
  }, [isElectron]);

  // Subscribe to live print stage events from Electron main process
  useEffect(() => {
    if (!isElectron) return;

    const stageHandler = (stage: PrintStage) => {
      currentStageRef.current = stage;
      setState((s) => ({ ...s, currentPrintStage: stage }));
    };

    window.electronAPI!.onPrintStage(stageHandler);

    // Subscribe to optional push-based printer status changes
    if (typeof window.electronAPI!.onPrinterStatusChange === 'function') {
      window.electronAPI!.onPrinterStatusChange!((status) => {
        const mapped = resolvePrinterStatus(undefined, status);
        setState((s) => ({ ...s, printerStatus: mapped }));
      });
    }

    return () => {
      window.electronAPI!.offPrintStage(stageHandler);
      if (typeof window.electronAPI!.offPrinterStatusChange === 'function') {
        window.electronAPI!.offPrinterStatusChange!();
      }
    };
  }, [isElectron]);

  // Adaptive polling — faster while a print stage is active
  useEffect(() => {
    if (!isElectron) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    fetchDeviceInfo();

    const getInterval = () => (currentStageRef.current !== 'idle' ? POLL_ACTIVE_MS : POLL_IDLE_MS);

    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timer = setTimeout(() => {
        fetchDeviceInfo().then(() => schedule());
      }, getInterval());
    };

    schedule();

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isElectron]);

  const isIdle = state.printerStatus === 'idle' && state.currentPrintStage === 'idle';
  const isBusy =
    state.printerStatus === 'printing' ||
    (state.currentPrintStage !== 'idle' &&
      state.currentPrintStage !== 'complete' &&
      state.currentPrintStage !== 'error');
  const isError = state.printerStatus === 'error' || state.currentPrintStage === 'error';
  const isPrinterConnected =
    state.printerStatus !== 'unknown' &&
    state.printerStatus !== 'disconnected' &&
    state.printerList.some((p) => p.name === state.printerSystemName || p.isDefault);

  return {
    isElectron,
    ...state,
    isIdle,
    isBusy,
    isError,
    isPrinterConnected,
    refetch: fetchDeviceInfo,
  };
}
