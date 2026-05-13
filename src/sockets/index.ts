import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { socketEmitter } from './socketEmitter';

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.NODE_ENV === 'production' ? env.CLIENT_URL : "http://localhost:5173",
      credentials: true,
    },
  });

  socketEmitter.init(io);

  // Middleware xác thực JWT
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    jwt.verify(token, env.JWT_ACCESS_SECRET, (err: any, decoded: any) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      (socket as any).user = decoded;
      next();
    });
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    if (!user) return;

    const userId = user.userId;
    const role = user.role;

    // Join room cá nhân
    socket.join(userId);
    
    // Join room theo role
    if (role) {
      socket.join(`role:${role}`);
    }

    console.log(`[Socket] User connected: ${userId} (Role: ${role})`);

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${userId}`);
    });
  });

  return io;
};
