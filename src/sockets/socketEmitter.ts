import { Server } from 'socket.io';

class SocketEmitter {
  private io: Server | null = null;

  init(io: Server) {
    this.io = io;
  }

  /**
   * Gửi thông báo đến một người dùng cụ thể
   */
  emitToUser(userId: string, event: string, data: any) {
    if (!this.io) return;
    // Chúng ta sẽ join người dùng vào room có tên là userId
    this.io.to(userId).emit(event, data);
  }

  /**
   * Gửi thông báo đến một nhóm người dùng (Role)
   */
  emitToRole(role: 'STANDARD' | 'VIP' | 'ADMIN', event: string, data: any) {
    if (!this.io) return;
    // Room theo role
    this.io.to(`role:${role}`).emit(event, data);
  }

  /**
   * Gửi thông báo đến tất cả mọi người
   */
  broadcast(event: string, data: any) {
    if (!this.io) return;
    this.io.emit(event, data);
  }
}

export const socketEmitter = new SocketEmitter();
