import { useCallback, useRef, useState } from 'react';
import { printHtml } from '@/lib/electron-print';
import type { PrintResult, PrintStage } from '@/lib/electron-print';

export type { PrintResult, PrintStage };

export interface PrintStandeeState {
  /** True while a print job is being prepared, spooled, or printing */
  isPending: boolean;
  /** Current stage in the print pipeline */
  stage: PrintStage;
  /** Result of the last print attempt — null before any print has been attempted */
  result: PrintResult | null;
  /** Human-readable error message when stage === 'error', null otherwise */
  error: string | null;
}

export interface UsePrintStandeeReturn extends PrintStandeeState {
  /** Trigger a print job with the given HTML and optional printer name */
  print: (html: string, printerName?: string) => Promise<PrintResult>;
  /** Reset state back to idle (useful after showing an error) */
  reset: () => void;
}

const IDLE_STATE: PrintStandeeState = {
  isPending: false,
  stage: 'idle',
  result: null,
  error: null,
};

/**
 * Manages the full lifecycle of a standee print job.
 *
 * Exposes `isPending`, `stage`, `result`, and `error` so the UI can
 * render per-stage feedback without duplicating state management.
 *
 * Stage flow:
 *   idle → preparing → spooling → printing → complete
 *                                          → error
 */
export function usePrintStandee(): UsePrintStandeeReturn {
  const [state, setState] = useState<PrintStandeeState>(IDLE_STATE);

  // Guard against state updates after the component unmounts
  const mountedRef = useRef(true);
  const set = useCallback((patch: Partial<PrintStandeeState>) => {
    if (mountedRef.current) setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const print = useCallback(
    async (html: string, printerName?: string): Promise<PrintResult> => {
      // Reset any previous error and mark as pending
      set({ isPending: true, stage: 'idle', result: null, error: null });

      const result = await printHtml(html, {
        printerName,
        onStageChange: (stage) => {
          const isPending = stage !== 'complete' && stage !== 'error';
          set({ stage, isPending });
        },
      });

      set({
        isPending: false,
        stage: result.stage,
        result,
        error: result.success ? null : (result.error ?? 'Print failed'),
      });

      return result;
    },
    [set]
  );

  const reset = useCallback(() => {
    setState(IDLE_STATE);
  }, []);

  return { ...state, print, reset };
}
