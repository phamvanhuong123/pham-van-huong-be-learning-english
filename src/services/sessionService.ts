import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

export const sessionService = {
  getSessions: async (userId: string, currentSessionId?: string) => {
    const sessions = await prisma.userSession.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        loginAt: true,
        lastActiveAt: true,
      }
    });

    return sessions.map(session => ({
      ...session,
      isCurrent: session.id === currentSessionId
    }));
  },

  revokeAllOther: async (userId: string, currentSessionId?: string) => {
    if (!currentSessionId) {
      throw new ApiError('Không thể xác định phiên hiện tại', StatusCodes.BAD_REQUEST);
    }
    const result = await prisma.userSession.updateMany({
      where: {
        userId,
        isActive: true,
        id: { not: currentSessionId }
      },
      data: { isActive: false }
    });
    return result.count;
  },

  revokeOne: async (userId: string, sessionId: string, currentSessionId?: string) => {
    if (sessionId === currentSessionId) {
      throw new ApiError('Không thể đăng xuất phiên đang sử dụng. Vui lòng dùng chức năng Đăng xuất.', StatusCodes.BAD_REQUEST);
    }

    const session = await prisma.userSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new ApiError('Phiên đăng nhập không tồn tại', StatusCodes.NOT_FOUND);
    if (session.userId !== userId) throw new ApiError('Phiên đăng nhập không hợp lệ', StatusCodes.FORBIDDEN);

    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false }
    });
  }
};
