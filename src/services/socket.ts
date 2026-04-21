import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (accessToken: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_API_BASE_URL, {
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
