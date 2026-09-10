import { getSocket } from '@/services/socket';
import { usePrintSocketStore } from '@/stores/print-socket-store';

/**
 * Shop-initiated outcomes for the job currently in flight.
 *
 * These live outside `usePrintSocket` because that hook is mounted once in the
 * layout, while the buttons that need these actions are several levels down in
 * the dashboard tree. Both only read the store and the socket, so there is
 * nothing hook-shaped about them — extracting them avoids drilling callbacks
 * through components that have no other use for them.
 */

/** Whether there is an active job for the shop to pass judgement on. */
export function hasActiveJob(): boolean {
  return Boolean(usePrintSocketStore.getState().sessionId);
}

/**
 * The shop says the pages came out.
 *
 * `confirmed: false` because a human at the counter said so — nothing observed
 * it in the spooler, and the customer's screen is told as much.
 */
export function markActiveJobComplete(): boolean {
  const { sessionId, printJobId } = usePrintSocketStore.getState();
  if (!sessionId) return false;

  getSocket().emit('client:print_complete', { sessionId, printJobId, confirmed: false });
  usePrintSocketStore
    .getState()
    .update({ sessionStatus: 'waiting', currentJob: null, printJobId: null });
  return true;
}

/**
 * The shop says it could not print this.
 *
 * Sends the customer the same fork an automatic failure does — retry for free,
 * or take the money back — so a job the shop gives up on stops sitting in the
 * queue without stranding whoever paid for it. `currentJob` is cleared but
 * `printJobId` is deliberately kept: a retry names the job by id, and the shop
 * giving up is not the customer giving up.
 */
export function markActiveJobFailed(reason: string): boolean {
  const { sessionId, printJobId } = usePrintSocketStore.getState();
  if (!sessionId) return false;

  getSocket().emit('client:print_error', {
    sessionId,
    printJobId,
    error: reason,
    code: 'SHOP_REPORTED',
  });
  usePrintSocketStore.getState().update({ sessionStatus: 'waiting', currentJob: null });
  return true;
}

/** The reasons a counter can pick from without typing. */
export const SHOP_FAILURE_REASONS = [
  'The printer is out of paper',
  'The printer is jammed or offline',
  'The file could not be printed',
] as const;
