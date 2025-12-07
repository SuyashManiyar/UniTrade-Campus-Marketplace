import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

// Socket.IO authentication middleware
const authenticateSocket = async (socket: AuthenticatedSocket, next: any) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isVerified: true }
    });

    if (!user || !user.isVerified) {
      return next(new Error('Authentication error: Invalid or unverified user'));
    }

    socket.userId = user.id;
    socket.userEmail = user.email;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

let io: SocketIOServer | null = null;

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`✅ Socket connected: ${socket.userId} (${socket.userEmail})`);

    // Join listing room when user views a listing
    socket.on('join-listing', (listingId: string) => {
      socket.join(`listing:${listingId}`);
      console.log(`📦 User ${socket.userId} joined listing room: ${listingId}`);
    });

    // Leave listing room
    socket.on('leave-listing', (listingId: string) => {
      socket.leave(`listing:${listingId}`);
      console.log(`📦 User ${socket.userId} left listing room: ${listingId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// Helper function to emit bid updates to all users viewing a listing
export const emitBidUpdate = (listingId: string, bidData: any) => {
  if (io) {
    io.to(`listing:${listingId}`).emit('bid-update', bidData);
    console.log(`📢 Emitted bid update for listing ${listingId}`);
  }
};

// Helper function to emit listing updates (for marketplace pages)
export const emitListingUpdate = (listingId: string, listingData: any) => {
  if (io) {
    io.emit('listing-update', { listingId, listing: listingData });
    console.log(`📢 Emitted listing update for listing ${listingId}`);
  }
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

