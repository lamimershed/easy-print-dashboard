import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores';
import { getSocket } from '@/services/socket';

type SessionStatus = 'idle' | 'waiting' | 'connected' | 'incoming' | 'printing';

interface PrintIncomingPayload {
  fileName: string;
  fileType: string;
  fileSize: number;
  copies: number;
  colorMode: string;
}

interface UsePrintSocketReturn {
  sessionStatus: SessionStatus;
  currentJob: PrintIncomingPayload | null;
  sessionId: string | null;
  isConnected: boolean;
  markComplete: () => void;
  markError: (error: string) => void;
}

export function usePrintSocket(clientId: string | undefined): UsePrintSocketReturn {
  const { accessToken } = useAuthStore();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  const [currentJob, setCurrentJob] = useState<PrintIncomingPayload | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
    });

    socket.on('client:joined', ({ sessionId: sid }: { sessionId: string }) => {
      setSessionId(sid);
      setSessionStatus('waiting');
    });

    socket.on('customer:joined', () => {
      setSessionStatus('connected');
    });

    socket.on('customer:left', () => {
      setSessionStatus('waiting');
      setCurrentJob(null);
      setSessionId(null);
    });

    socket.on('print:incoming', (payload: PrintIncomingPayload) => {
      setCurrentJob(payload);
      setSessionStatus('incoming');
    });

    socket.on('print:ready', () => {
      setSessionStatus('printing');
    });

    socket.on('session:ended', () => {
      setSessionStatus('waiting');
      setCurrentJob(null);
      setSessionId(null);
    });

    if (!socket.connected) socket.connect();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('client:joined');
      socket.off('customer:joined');
      socket.off('customer:left');
      socket.off('print:incoming');
      socket.off('print:ready');
      socket.off('session:ended');
    };
  }, [accessToken, clientId]);

  const markComplete = useCallback(() => {
    if (!accessToken || !sessionId) return;
    const socket = getSocket(accessToken);
    socket.emit('client:print_complete', sessionId);
    setSessionStatus('waiting');
    setCurrentJob(null);
    setSessionId(null);
  }, [accessToken, sessionId]);

  const markError = useCallback(
    (error: string) => {
      if (!accessToken || !sessionId) return;
      const socket = getSocket(accessToken);
      socket.emit('client:print_error', { sessionId, error });
      setSessionStatus('waiting');
      setCurrentJob(null);
      setSessionId(null);
    },
    [accessToken, sessionId]
  );

  return { sessionStatus, currentJob, sessionId, isConnected, markComplete, markError };
}
