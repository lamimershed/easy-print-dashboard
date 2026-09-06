import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import { usePrintSocketStore } from '@/stores/print-socket-store';
import { getSocket, reconnectSocket } from '@/services/socket';
import { refreshAccessToken } from '@/services/api';
import { isElectron } from '@/lib/electron-print';
import { savePendingJob, getPendingJob, clearPendingJob } from '@/lib/print-job-db';
import type { PrintStage, RealStatus } from '@/types/electron';
import type { SessionStatus, PrintIncomingPayload } from '@/stores/print-socket-store';

interface PrintChunkPayload {
  chunk: ArrayBuffer;
  chunkIndex: number;
  totalChunks: number;
}

interface UsePrintSocketReturn {
  sessionStatus: SessionStatus;
  currentJob: PrintIncomingPayload | null;
  sessionId: string | null;
  isConnected: boolean;
  printStage: PrintStage;
  markComplete: () => void;
  markError: (error: string) => void;
}

const STALE_MS = 5 * 60 * 1000;

/**
 * How many times one mount will refresh the token and reconnect after the server
 * rejects `client:join`. A cap, because if a fresh token is still rejected the
 * problem is not the token and retrying forever would hammer /auth/refresh.
 */
const MAX_REAUTH_ATTEMPTS = 3;

export function usePrintSocket(clientId: string | undefined): UsePrintSocketReturn {
  // Deliberately not `accessToken`: that changes on every refresh, and this
  // effect tears down the socket handlers and re-runs crash recovery when its
  // deps change. `getSocket` reads the live token at handshake time instead.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  const sessionStatus = usePrintSocketStore((s) => s.sessionStatus);
  const currentJob = usePrintSocketStore((s) => s.currentJob);
  const sessionId = usePrintSocketStore((s) => s.sessionId);
  const isConnected = usePrintSocketStore((s) => s.isConnected);
  const printStage = usePrintSocketStore((s) => s.printStage);

  const chunksRef = useRef<Map<number, Uint8Array>>(new Map());

  useEffect(() => {
    if (!isAuthenticated || !clientId) return;

    const socket = getSocket();
    const store = () => usePrintSocketStore.getState();

    // Shared print execution — used by both print:ready and crash recovery
    const attemptPrint = async (buffer: ArrayBuffer, job: PrintIncomingPayload, sid: string) => {
      if (!isElectron()) {
        const blob = new Blob([buffer], { type: job.fileType });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        await clearPendingJob();
        store().update({ printStage: 'complete', sessionStatus: 'waiting', currentJob: null });
        getSocket().emit('client:print_complete', sid);
        setTimeout(() => {
          void queryClient.invalidateQueries({ queryKey: ['analytics'] });
        }, 1500);
        return;
      }

      const stageHandler = (stage: PrintStage) => store().update({ printStage: stage });
      window.electronAPI!.onPrintStage(stageHandler);
      store().update({ printStage: 'preparing' });

      // Fetch the printer name so the companion can apply Canon-specific
      // grayscale settings (CNIJGrayScale) which require an explicit -p printerName.
      let printerName: string | undefined;
      try {
        const deviceInfo = await window.electronAPI!.getDeviceInfo();
        printerName = deviceInfo.printer?.name ?? undefined;
      } catch {
        // proceed without printerName; lpr will use the system default printer
      }

      try {
        const result = await window.electronAPI!.printFile({
          fileData: buffer,
          fileName: job.fileName,
          copies: job.copies,
          colorMode: job.colorMode,
          duplex: job.duplex,
          pageRange: job.pageRange,
          // Whatever the customer was charged for is what gets printed.
          paperSize: job.paperSize,
          printerName,
        });
        await clearPendingJob();
        store().update({ printStage: result.stage, sessionStatus: 'waiting', currentJob: null });
        const s = getSocket();
        if (result.success) {
          s.emit('client:print_complete', sid);
        } else {
          s.emit('client:print_error', { sessionId: sid, error: result.error ?? 'Print failed' });
        }
        setTimeout(() => {
          void queryClient.invalidateQueries({ queryKey: ['analytics'] });
        }, 1500);
      } catch (err) {
        await clearPendingJob();
        store().update({ printStage: 'error', sessionStatus: 'waiting', currentJob: null });
        getSocket().emit('client:print_error', {
          sessionId: sid,
          error: (err as Error).message,
        });
        setTimeout(() => {
          void queryClient.invalidateQueries({ queryKey: ['analytics'] });
        }, 1500);
      } finally {
        window.electronAPI!.offPrintStage(stageHandler);
      }
    };

    let disposed = false;
    let reauthAttempts = 0;

    // ── Printer state reporting ──────────────────────────────────────────────
    // The backend gates customer uploads on this. Without it "online" only means
    // "an app is connected", which is why customers could reach a shop whose
    // printer was switched off. Companion builds without the IPC report nothing
    // and the backend keeps treating them as available.
    const reportPrinterStatus = async (known?: RealStatus) => {
      if (disposed || !socket.connected) return;
      let status = known;
      if (!status) {
        if (!isElectron() || typeof window.electronAPI?.getPrinterRealStatus !== 'function') return;
        try {
          status = await window.electronAPI.getPrinterRealStatus();
        } catch {
          return;
        }
      }
      if (disposed || !socket.connected) return;
      socket.emit('client:printer_status', { status });
    };

    if (isElectron() && typeof window.electronAPI?.onPrinterRealStatus === 'function') {
      window.electronAPI.onPrinterRealStatus((status) => void reportPrinterStatus(status));
    }

    // ── Auth recovery ────────────────────────────────────────────────────────
    // Socket.IO freezes `handshake.auth` when the connection opens, so a token
    // that expired mid-connection cannot be replaced on the live socket — the
    // only fix is refresh + fresh handshake.
    const ensureToken = async () => {
      if (useAuthStore.getState().accessToken) return true;
      try {
        await refreshAccessToken();
        return true;
      } catch {
        return false;
      }
    };

    const onServerError = ({ code }: { code?: string }) => {
      if (code !== 'UNAUTHORIZED') return;
      if (reauthAttempts >= MAX_REAUTH_ATTEMPTS) {
        store().update({ isConnected: false });
        return;
      }
      reauthAttempts += 1;
      void refreshAccessToken()
        .then(() => {
          if (!disposed) reconnectSocket();
        })
        .catch(() => {
          // The axios interceptor owns the logout redirect — nothing to do here.
        });
    };

    // On mount: recover any job that survived a crash or page refresh
    void getPendingJob().then((pending) => {
      if (!pending) return;
      if (Date.now() - pending.savedAt > STALE_MS) {
        void clearPendingJob();
        return;
      }
      store().update({
        sessionId: pending.sessionId,
        currentJob: pending.job,
        sessionStatus: 'printing',
      });
      void attemptPrint(pending.buffer, pending.job, pending.sessionId);
    });

    socket.on('connect', () => {
      store().update({ isConnected: true, sessionStatus: 'waiting' });
      socket.emit('client:join', clientId);
    });

    socket.on('disconnect', () => {
      store().update({ isConnected: false, sessionStatus: 'idle', sessionId: null });
    });

    socket.on('error', onServerError);

    socket.on('client:joined', ({ sessionId: sid }: { sessionId: string }) => {
      // The join stuck, so the token is good — start the retry budget over.
      reauthAttempts = 0;
      store().update({ sessionId: sid, sessionStatus: 'waiting' });
      // Only now does the server hold a session to attach the status to.
      void reportPrinterStatus();
    });

    socket.on('customer:joined', () => {
      store().update({ sessionStatus: 'connected' });
    });

    socket.on('customer:left', () => {
      chunksRef.current.clear();
      store().update({ sessionStatus: 'waiting', currentJob: null });
    });

    socket.on('print:incoming', (payload: PrintIncomingPayload) => {
      chunksRef.current.clear();
      store().update({ printStage: 'idle', currentJob: payload, sessionStatus: 'incoming' });
    });

    socket.on('print:chunk', ({ chunk, chunkIndex }: PrintChunkPayload) => {
      chunksRef.current.set(chunkIndex, new Uint8Array(chunk));
    });

    socket.on('print:ready', () => {
      store().update({ sessionStatus: 'printing' });
      const { currentJob: job, sessionId: sid } = store();
      if (!job || !sid) return;

      const sorted = Array.from(chunksRef.current.entries())
        .sort(([a], [b]) => a - b)
        .map(([, c]) => c);
      const totalLength = sorted.reduce((acc, c) => acc + c.byteLength, 0);
      const buffer = new ArrayBuffer(totalLength);
      const view = new Uint8Array(buffer);
      let offset = 0;
      for (const c of sorted) {
        view.set(c, offset);
        offset += c.byteLength;
      }
      chunksRef.current.clear();

      void savePendingJob({ sessionId: sid, job, buffer, savedAt: Date.now() }).then(() =>
        attemptPrint(buffer, job, sid)
      );
    });

    socket.on('session:ended', () => {
      chunksRef.current.clear();
      store().update({ sessionStatus: 'waiting', currentJob: null });
    });

    void ensureToken().then((ok) => {
      if (ok && !disposed && !socket.connected) socket.connect();
    });

    return () => {
      disposed = true;
      if (isElectron() && typeof window.electronAPI?.offPrinterRealStatus === 'function') {
        window.electronAPI.offPrinterRealStatus();
      }
      socket.off('error', onServerError);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('client:joined');
      socket.off('customer:joined');
      socket.off('customer:left');
      socket.off('print:incoming');
      socket.off('print:chunk');
      socket.off('print:ready');
      socket.off('session:ended');
    };
  }, [isAuthenticated, clientId, queryClient]);

  const markComplete = useCallback(() => {
    const { sessionId: sid } = usePrintSocketStore.getState();
    if (!sid) return;
    getSocket().emit('client:print_complete', sid);
    usePrintSocketStore.getState().update({ sessionStatus: 'waiting', currentJob: null });
    setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }, 1500);
  }, [queryClient]);

  const markError = useCallback(
    (error: string) => {
      const { sessionId: sid } = usePrintSocketStore.getState();
      if (!sid) return;
      getSocket().emit('client:print_error', { sessionId: sid, error });
      usePrintSocketStore.getState().update({ sessionStatus: 'waiting', currentJob: null });
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['analytics'] });
      }, 1500);
    },
    [queryClient]
  );

  return { sessionStatus, currentJob, sessionId, isConnected, printStage, markComplete, markError };
}
