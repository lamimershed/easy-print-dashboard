import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/config/api-base-url';

let socket: Socket | null = null;

export const getSocket = (accessToken: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(API_BASE_URL, {
    auth: { token: accessToken },
    withCredentials: true,
    autoConnect: true,
    extraHeaders: {
      'ngrok-skip-browser-warning': 'true',
    },
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
