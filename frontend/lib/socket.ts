import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }

  const token = Cookies.get('token');

  if (!token) {
    return null;
  }

  // Reuse existing connection if available and connected
  if (socket && socket.connected) {
    return socket;
  }

  // Create new connection
  socket = io(SOCKET_URL, {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('✅ Socket.IO connected');
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket.IO disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket.IO connection error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Helper to join a listing room
export const joinListingRoom = (listingId: string) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('join-listing', listingId);
  }
};

// Helper to leave a listing room
export const leaveListingRoom = (listingId: string) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('leave-listing', listingId);
  }
};

