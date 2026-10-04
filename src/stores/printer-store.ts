import { create } from 'zustand';
import type {
  ChromiumPrinter,
  DeviceInfo,
  PrintQueueJob,
  PrintStage,
  PrinterSnapshot,
} from '@/types/electron';

/** Older companions have no monitor; they are polled the way they always were. */
const LEGACY_POLL_IDLE_MS = 30_000;
const LEGACY_POLL_ACTIVE_MS = 5_000;

interface PrinterStoreState {
  /** The companion's latest reading. Survives navigation — it lives here, not in a component. */
  snapshot: PrinterSnapshot | null;
  /** False until the first reading arrives, so the UI can say "checking" instead of "no printer". */
  loaded: boolean;
  /** A user-requested re-read is running. Background reads never set this. */
  refreshing: boolean;
  /** The companion bridge itself failed (not the printer). */
  error: string | null;
  printStage: PrintStage;
  /** Full system printer list, for the print monitor's printer list. */
  printerList: ChromiumPrinter[];
  /** OS spooler jobs for the default printer — fetched only when it has some. */
  printQueue: PrintQueueJob[];
  refresh: () => Promise<void>;
}

const api = () => (typeof window !== 'undefined' ? window.electronAPI : undefined);

function fromDeviceInfo(info: DeviceInfo, printers: ChromiumPrinter[]): PrinterSnapshot {
  const p = info.printer;
  return {
    printers: printers.map((x) => ({
      name: x.name,
      displayName: x.displayName || x.name,
      isDefault: x.isDefault,
    })),
    printer: p
      ? {
          name: p.name,
          displayName: p.displayName || p.name,
          status: p.realStatus ?? 'unknown',
          alerts: [],
          connection: {
            kind: 'unknown',
            label: '',
            port: null,
            address: null,
            present: null,
            sharedOnNetwork: false,
          },
          queue: { jobs: null },
          location: null,
          comment: null,
          driver: null,
          capabilities: { twoSided: info.supportsDuplex },
          defaults: null,
          supplies: info.supplyLevels,
          suppliesError: info.cupsError ?? null,
        }
      : null,
    error: null,
    updatedAt: Date.now(),
  };
}

export const usePrinterStore = create<PrinterStoreState>(() => ({
  snapshot: null,
  loaded: false,
  refreshing: false,
  error: null,
  printStage: 'idle',
  printerList: [],
  printQueue: [],
  refresh: () => refreshPrinter(),
}));

let started = false;
let lastPrintersKey = '';

async function syncPrinterList(snapshot: PrinterSnapshot | null, force = false) {
  const electron = api();
  if (!electron) return;
  const key = JSON.stringify(snapshot?.printers ?? []);
  if (!force && key === lastPrintersKey) return;
  lastPrintersKey = key;
  try {
    usePrinterStore.setState({ printerList: await electron.getPrinters() });
  } catch {
    // Keep the previous list — it is only informational.
  }
}

async function syncPrintQueue(snapshot: PrinterSnapshot | null) {
  const electron = api();
  const jobs = snapshot?.printer?.queue.jobs;
  if (!electron?.getPrintQueue || jobs === 0 || !snapshot?.printer) {
    usePrinterStore.setState({ printQueue: [] });
    return;
  }
  try {
    usePrinterStore.setState({ printQueue: await electron.getPrintQueue(snapshot.printer.name) });
  } catch {
    // Optional detail — leave the last list in place.
  }
}

function applySnapshot(snapshot: PrinterSnapshot | null) {
  usePrinterStore.setState({ snapshot, loaded: true, error: null });
  void syncPrinterList(snapshot);
  void syncPrintQueue(snapshot);
}

async function readLegacy(): Promise<PrinterSnapshot> {
  const electron = api()!;
  const [info, printers] = await Promise.all([electron.getDeviceInfo(), electron.getPrinters()]);
  return fromDeviceInfo(info, printers);
}

async function refreshPrinter() {
  const electron = api();
  if (!electron) return;
  usePrinterStore.setState({ refreshing: true });
  try {
    const snapshot = electron.getPrinterSnapshot
      ? await electron.getPrinterSnapshot({ force: true })
      : await readLegacy();
    applySnapshot(snapshot);
    void syncPrinterList(snapshot, true);
  } catch (err) {
    usePrinterStore.setState({
      loaded: true,
      error: err instanceof Error ? err.message : 'Could not reach the companion app',
    });
  } finally {
    usePrinterStore.setState({ refreshing: false });
  }
}

function startLegacyPolling() {
  const tick = async () => {
    try {
      applySnapshot(await readLegacy());
    } catch (err) {
      usePrinterStore.setState({
        loaded: true,
        error: err instanceof Error ? err.message : 'Failed to get device info',
      });
    }
    const idle = usePrinterStore.getState().printStage === 'idle';
    setTimeout(tick, idle ? LEGACY_POLL_IDLE_MS : LEGACY_POLL_ACTIVE_MS);
  };
  void tick();
}

/**
 * Subscribes to the companion once for the life of the app. Safe to call from
 * every component that reads printer state — only the first call does anything.
 */
export function startPrinterMonitor() {
  const electron = api();
  if (started || !electron?.isElectron) return;
  started = true;

  electron.onPrintStage((printStage) => usePrinterStore.setState({ printStage }));

  if (!electron.getPrinterSnapshot || !electron.onPrinterSnapshot) {
    startLegacyPolling();
    return;
  }

  electron.onPrinterSnapshot(applySnapshot);
  electron
    .getPrinterSnapshot()
    .then(applySnapshot)
    .catch((err: unknown) =>
      usePrinterStore.setState({
        loaded: true,
        error: err instanceof Error ? err.message : 'Could not reach the companion app',
      })
    );
}
