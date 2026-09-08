import type { PrintIncomingPayload } from '@/stores/print-socket-store';

const DB_NAME = 'easy-print';
const STORE = 'pending-job';
const KEY = 'current';

export interface PendingPrintJob {
  sessionId: string;
  job: PrintIncomingPayload;
  buffer: ArrayBuffer;
  savedAt: number;
  /** The server's job id, so a retry can name the job it is re-printing. */
  printJobId?: string;
  /**
   * 'pending' — interrupted mid-print; recovered automatically on next launch.
   * 'failed'  — finished as a failure; kept only so a customer-requested retry
   *             can re-print the same bytes without a re-upload, and never
   *             auto-printed on mount.
   */
  state?: 'pending' | 'failed';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePendingJob(data: PendingPrintJob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).put(data, KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingJob(): Promise<PendingPrintJob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve((req.result as PendingPrintJob) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearPendingJob(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).delete(KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
