import { io } from 'socket.io-client';
import { getApiOrigin } from './backendApi';

// Socket.IO attaches at the server origin, not under /api — the incoming
// version pointed at `https://smartkisan-backend.onrender.com/api`, which is
// both a dead service (404) and the wrong path shape. Derive the origin from
// the one place the backend URL is configured so the two can never drift.
const SOCKET_URL = getApiOrigin();

// `autoConnect: false` because this module used to dial out the moment it was
// imported — before login, before a token existed. Connect explicitly once the
// user is authenticated.
const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: false,
  reconnectionDelay: 2000,
});

socket.on('connect', () => {
  if (__DEV__) console.log('Socket connected:', socket.id);
});

socket.on('connect_error', (err) => {
  // Render's free tier sleeps; a failed connect here is expected while it
  // wakes and should not be surfaced as an app error.
  if (__DEV__) console.warn('Socket connect error:', err?.message);
});

export const connectSocket = (userId) => {
  if (socket.connected) return socket;
  if (userId) socket.auth = { userId };
  socket.connect();
  return socket;
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

export default socket;
