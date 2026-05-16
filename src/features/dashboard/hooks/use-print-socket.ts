import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores';
import { getSocket } from '@/services/socket';
import { isElectron } from '@/lib/electron-print';
import type { PrintStage } from '@/types/electron';

type SessionStatus = 'idle' | 'waiting' | 'connected' | 'incoming' | 'printing';

interface PrintIncomingPayload {
  fileName: string;
  fileType: string;
  fileSize: number;
  copies: number;
  colorMode: 'color' | 'blackwhite';
}

interface PrintChunkPayload {
  chunk: ArrayBuffer;
  chunkIndex: number;
  totalChunks: number;
}

interface UsePrintSocketOptions {
  onPrintSettled?: (success: boolean) => void;
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

export function usePrintSocket(
  clientId: string | undefined,
  options?: UsePrintSocketOptions
): UsePrintSocketReturn {
  const { accessToken } = useAuthStore();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  const [currentJob, setCurrentJob] = useState<PrintIncomingPayload | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [printStage, setPrintStage] = useState<PrintStage>('idle');

  const chunksRef = useRef<Map<number, Uint8Array>>(new Map());
  const currentJobRef = useRef<PrintIncomingPayload | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const onPrintSettledRef = useRef(options?.onPrintSettled);

  useEffect(() => {
    onPrintSettledRef.current = options?.onPrintSettled;
  }, [options?.onPrintSettled]);

  useEffect(() => {
    currentJobRef.current = currentJob;
  }, [currentJob]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (!accessToken || !clientId) return;

    const socket = getSocket(accessToken);

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('client:join', clientId);
      setSessionStatus('waiting');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setSessionStatus('idle');
      setSessionId(null);
    });

    socket.on('client:joined', ({ sessionId: sid }: { sessionId: string }) => {
      setSessionId(sid);
      setSessionStatus('waiting');
    });

    socket.on('customer:joined', () => {
      setSessionStatus('connected');
    });

    socket.on('customer:left', () => {
      chunksRef.current.clear();
      setSessionStatus('waiting');
      setCurrentJob(null);
      // sessionId is permanent for this client — do not clear
    });

    socket.on('print:incoming', (payload: PrintIncomingPayload) => {
      chunksRef.current.clear();
      setPrintStage('idle');
      setCurrentJob(payload);
      setSessionStatus('incoming');
    });

    socket.on('print:chunk', ({ chunk, chunkIndex }: PrintChunkPayload) => {
      chunksRef.current.set(chunkIndex, new Uint8Array(chunk));
    });

    socket.on('print:ready', () => {
      setSessionStatus('printing');
      const job = currentJobRef.current;
      const sid = sessionIdRef.current;
      if (!job || !sid) return;

      // Assemble chunks in order
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

      if (!isElectron()) {
        // Browser fallback — open the file in a new tab so the user can print manually,
        // then immediately signal the backend so the session isn't left hanging.
        const blob = new Blob([buffer], { type: job.fileType });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        setPrintStage('complete');
        const s = getSocket(accessToken);
        s.emit('client:print_complete', sid);
        onPrintSettledRef.current?.(true);
        setSessionStatus('waiting');
        setCurrentJob(null);
        return;
      }

      const stageHandler = (stage: PrintStage) => setPrintStage(stage);
      window.electronAPI!.onPrintStage(stageHandler);
      setPrintStage('preparing');

      void window
        .electronAPI!.printFile({
          fileData: buffer,
          fileName: job.fileName,
          copies: job.copies,
          colorMode: job.colorMode,
        })
        .then((result) => {
          setPrintStage(result.stage);
          const s = getSocket(accessToken);
          if (result.success) {
            s.emit('client:print_complete', sid);
          } else {
            s.emit('client:print_error', { sessionId: sid, error: result.error ?? 'Print failed' });
          }
          onPrintSettledRef.current?.(result.success);
          setSessionStatus('waiting');
          setCurrentJob(null);
          // sessionId is permanent — do not clear
        })
        .catch((err: Error) => {
          setPrintStage('error');
          const s = getSocket(accessToken);
          s.emit('client:print_error', { sessionId: sid, error: err.message });
          onPrintSettledRef.current?.(false);
          setSessionStatus('waiting');
          setCurrentJob(null);
          // sessionId is permanent — do not clear
        })
        .finally(() => {
          window.electronAPI!.offPrintStage(stageHandler);
        });
    });

    socket.on('session:ended', () => {
      chunksRef.current.clear();
      setSessionStatus('waiting');
      setCurrentJob(null);
      // sessionId is permanent — do not clear
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
  }, [accessToken, clientId]);

  const markComplete = useCallback(() => {
    if (!accessToken || !sessionId) return;
    const socket = getSocket(accessToken);
    socket.emit('client:print_complete', sessionId);
    onPrintSettledRef.current?.(true);
    setSessionStatus('waiting');
    setCurrentJob(null);
    // sessionId is permanent — do not clear
  }, [accessToken, sessionId]);

  const markError = useCallback(
    (error: string) => {
      if (!accessToken || !sessionId) return;
      const socket = getSocket(accessToken);
      socket.emit('client:print_error', { sessionId, error });
      onPrintSettledRef.current?.(false);
      setSessionStatus('waiting');
      setCurrentJob(null);
      // sessionId is permanent — do not clear
    },
    [accessToken, sessionId]
  );

  return { sessionStatus, currentJob, sessionId, isConnected, printStage, markComplete, markError };
}
