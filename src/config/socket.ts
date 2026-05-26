import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '@/utils/jwtTokenHelper';
import { env } from '@/config/environment';

let io: SocketIOServer;

// Map: userId -> Set<socketId>
const userSocketMap = new Map<string, Set<string>>();

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL || 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Client must emit 'authenticate' with { token: '...' } immediately after connection
    socket.on('authenticate', (data: { token: string }) => {
      try {
        const decoded = verifyToken(data.token, env.ACCESS_TOKEN_SECRET_SIGNATURE!) as any;
        const userId = decoded.id;

        socket.data.userId = userId;

        if (!userSocketMap.has(userId)) {
          userSocketMap.set(userId, new Set());
        }
        userSocketMap.get(userId)!.add(socket.id);
        
        socket.emit('authenticated', { success: true });
      } catch (error) {
        socket.emit('unauthorized', { message: 'Invalid or expired token' });
        socket.disconnect();
      }
    });

    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      if (userId && userSocketMap.has(userId)) {
        const sockets = userSocketMap.get(userId)!;
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSocketMap.delete(userId);
        }
      }
    });
  });

  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (!io) return;
  const socketIds = userSocketMap.get(userId);
  if (socketIds) {
    socketIds.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
  }
};

export const isUserOnline = (userId: string): boolean => {
  return userSocketMap.has(userId);
};
