import { useEffect } from 'react';
import { startPrinterMonitor, usePrinterStore } from '@/stores';
import type { RealStatus } from '@/types/electron';
import type { PrinterFeedbackState, PrinterStatus } from '../types';

const STATUS_FROM_REAL: Record<RealStatus, PrinterStatus> = {
  ready: 'idle',
  printing: 'printing',
  queue_stopped: 'queue_stopped',
  disconnected: 'disconnected',
  unknown: 'unknown',
};

/**
 * Printer state for any component that shows it.
 *
 * Reads the shared printer store, which subscribes to the companion's monitor
 * once for the life of the app. Mounting this hook no longer fetches anything,
 * so navigating between pages shows the last reading immediately instead of
 * starting from "No Printer Found" every time.
 */
export function usePrinterFeedback(): PrinterFeedbackState {
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron === true;

  useEffect(() => {
    startPrinterMonitor();
  }, []);

  const snapshot = usePrinterStore((s) => s.snapshot);
  const loaded = usePrinterStore((s) => s.loaded);
  const refreshing = usePrinterStore((s) => s.refreshing);
  const bridgeError = usePrinterStore((s) => s.error);
  const currentPrintStage = usePrinterStore((s) => s.printStage);
  const printerList = usePrinterStore((s) => s.printerList);
  const printQueue = usePrinterStore((s) => s.printQueue);
  const refresh = usePrinterStore((s) => s.refresh);

  const details = snapshot?.printer ?? null;
  const supplyLevels = details?.supplies ?? [];
  const printerStatus: PrinterStatus = !isElectron
    ? 'unknown'
    : details
      ? (STATUS_FROM_REAL[details.status] ?? 'unknown')
      : loaded
        ? 'disconnected'
        : 'unknown';

  const isIdle = printerStatus === 'idle' && currentPrintStage === 'idle';
  const isBusy =
    printerStatus === 'printing' ||
    (currentPrintStage !== 'idle' &&
      currentPrintStage !== 'complete' &&
      currentPrintStage !== 'error');
  const isError = printerStatus === 'error' || currentPrintStage === 'error';
  const isPrinterConnected =
    !!details && printerStatus !== 'unknown' && printerStatus !== 'disconnected';

  return {
    isElectron,
    loaded: !isElectron || loaded,
    details,
    stale: snapshot?.stale === true,
    printerName: details?.displayName ?? null,
    printerSystemName: details?.name ?? null,
    printerStatus,
    currentPrintStage,
    paperLevel: supplyLevels.find((s) => s.type === 'paper')?.levelPercent ?? null,
    inkLevel: supplyLevels.find((s) => s.type === 'ink')?.levelPercent ?? null,
    supplyLevels,
    printerList,
    printQueue,
    lastRefreshedAt: snapshot ? new Date(snapshot.updatedAt) : null,
    supportsDuplex: details?.capabilities?.twoSided === true,
    isLoading: isElectron && (!loaded || refreshing),
    error: bridgeError ?? snapshot?.error ?? null,
    cupsError: details?.suppliesError ?? null,
    isIdle,
    isBusy,
    isError,
    isPrinterConnected,
    refetch: () => void refresh(),
  };
}
