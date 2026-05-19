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
}

interface PrintSocketState {
  sessionStatus: SessionStatus;
  currentJob: PrintIncomingPayload | null;
  sessionId: string | null;
  isConnected: boolean;
  printStage: PrintStage;
  update: (partial: Partial<Omit<PrintSocketState, 'update'>>) => void;
}

export const usePrintSocketStore = create<PrintSocketState>((set) => ({
  sessionStatus: 'idle',
  currentJob: null,
  sessionId: null,
  isConnected: false,
  printStage: 'idle',
  update: (partial) => set(partial),
}));
