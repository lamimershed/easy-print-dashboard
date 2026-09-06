import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/config/api-base-url';
import { useAuthStore } from '@/stores/auth-store';

let socket: Socket | null = null;

/**
 * The shop's socket. One instance for the lifetime of the tab.
 *
 * `auth` is the callback form on purpose: Socket.IO invokes it before *every*
 * handshake, so an automatic reconnect picks up whatever token the store holds
 * now. The object form froze the token captured at construction, which meant any
 * reconnect more than 15 minutes after login replayed an expired token — the
 * socket connected (the guard only runs on messages), `client:join` was rejected
 * in silence, and the shop showed offline to customers while its own screen said
 * connected.
 */
export const getSocket = (): Socket => {
  if (socket) return socket;

  socket = io(API_BASE_URL, {
    auth: (cb: (data: { token: string }) => void) => {
      const token = useAuthStore.getState().accessToken ?? '';
      cb({ token });
    },
    withCredentials: true,
    // The hook owns connection timing — it makes sure a token exists first.
    autoConnect: false,
    extraHeaders: {
      'ngrok-skip-browser-warning': 'true',
    },
  });

  return socket;
};

/**
 * Forces a new handshake so the connection carries the current token.
 *
 * Socket.IO fixes `handshake.auth` when the connection opens, so a token
 * refreshed mid-connection cannot reach the server's guard on the existing
 * socket — only a fresh connection can.
 */
export const reconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket.connect();
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
