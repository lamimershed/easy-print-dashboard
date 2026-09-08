import { create } from 'zustand';
import type { PrintStage } from '@/types/electron';

export type SessionStatus = 'idle' | 'waiting' | 'connected' | 'incoming' | 'printing';

export interface PrintIncomingPayload {
  fileName: string;
  fileType: string;
  fileSize: number;
  copies: number;
  colorMode: 'color' | 'blackwhite';
  duplex?: 'simplex' | 'longEdge' | 'shortEdge';
  pageRange?: string;
  /** Sheet size the customer was quoted and charged for. */
  paperSize?: 'A4' | 'A3' | 'A5' | 'LETTER' | 'LEGAL';
}

interface PrintSocketState {
  sessionStatus: SessionStatus;
  currentJob: PrintIncomingPayload | null;
  sessionId: string | null;
  /**
   * True only once the server has ACCEPTED the join — not merely when the TCP
   * socket opened. The two are different: the handshake is unauthenticated, so
   * a socket with an expired token connects and is then rejected on `client:join`.
   * Reporting the open socket as "connected" is what let the shop see a green
   * dot while customers were told it was offline.
   */
  isConnected: boolean;
  /** Why the shop is not connected, for the dashboard to show. Null when fine. */
  connectionError: string | null;
  printStage: PrintStage;
  /**
   * The server's id for the job being printed, handed over with `print:ready`.
   * Echoed back on every outcome so the backend can attribute it even after a
   * restart has emptied its in-memory session map.
   */
  printJobId: string | null;
  /** Live page count from the OS spooler — null before the job surfaces. */
  pagesPrinted: number | null;
  totalPages: number | null;
  /** Set while the job is stopped for a recoverable reason (paper out, offline). */
  blockedReason: string | null;
  update: (partial: Partial<Omit<PrintSocketState, 'update'>>) => void;
}

export const usePrintSocketStore = create<PrintSocketState>((set) => ({
  sessionStatus: 'idle',
  currentJob: null,
  sessionId: null,
  isConnected: false,
  connectionError: null,
  printStage: 'idle',
  printJobId: null,
  pagesPrinted: null,
  totalPages: null,
  blockedReason: null,
  update: (partial) => set(partial),
}));
