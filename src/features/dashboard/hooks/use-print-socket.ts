import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import { usePrintSocketStore } from '@/stores/print-socket-store';
import { getSocket } from '@/services/socket';
import { isElectron } from '@/lib/electron-print';
import { savePendingJob, getPendingJob, clearPendingJob } from '@/lib/print-job-db';
import type { PrintStage } from '@/types/electron';
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

export function usePrintSocket(clientId: string | undefined): UsePrintSocketReturn {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const sessionStatus = usePrintSocketStore((s) => s.sessionStatus);
  const currentJob = usePrintSocketStore((s) => s.currentJob);
  const sessionId = usePrintSocketStore((s) => s.sessionId);
  const isConnected = usePrintSocketStore((s) => s.isConnected);
  const printStage = usePrintSocketStore((s) => s.printStage);

  const chunksRef = useRef<Map<number, Uint8Array>>(new Map());

  useEffect(() => {
    if (!accessToken || !clientId) return;

    const socket = getSocket(accessToken);
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
        getSocket(accessToken).emit('client:print_complete', sid);
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
        const s = getSocket(accessToken);
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
        getSocket(accessToken).emit('client:print_error', {
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

    socket.on('client:joined', ({ sessionId: sid }: { sessionId: string }) => {
      store().update({ sessionId: sid, sessionStatus: 'waiting' });
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

    if (!socket.connected) socket.connect();

    return () => {
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
  }, [accessToken, clientId, queryClient]);

  const markComplete = useCallback(() => {
    const { sessionId: sid } = usePrintSocketStore.getState();
    if (!accessToken || !sid) return;
    getSocket(accessToken).emit('client:print_complete', sid);
    usePrintSocketStore.getState().update({ sessionStatus: 'waiting', currentJob: null });
    setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }, 1500);
  }, [accessToken, queryClient]);

  const markError = useCallback(
    (error: string) => {
      const { sessionId: sid } = usePrintSocketStore.getState();
      if (!accessToken || !sid) return;
      getSocket(accessToken).emit('client:print_error', { sessionId: sid, error });
      usePrintSocketStore.getState().update({ sessionStatus: 'waiting', currentJob: null });
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ['analytics'] });
      }, 1500);
    },
    [accessToken, queryClient]
  );

  return { sessionStatus, currentJob, sessionId, isConnected, printStage, markComplete, markError };
}
