import { prisma } from '@/config/prisma';
import { emitToUser } from '@/config/socket';

export const notificationService = {
  createNotification: async (
    userId: string,
    title: string,
    body: string,
    type: 'SYSTEM' | 'SUBSCRIPTION' | 'EXAM_REMINDER' | 'VOCAB_REMINDER' | 'STREAK_REMINDER' | 'AI_COMPLETE' = 'SYSTEM'
  ) => {
    // Lưu vào DB
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
      },
    });

    // Bắn socket realtime
    emitToUser(userId, 'new_notification', {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });

    return notification;
  },

  getMyNotifications: async (userId: string, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId, isDeleted: false } }),
      prisma.notification.count({ where: { userId, isDeleted: false, isRead: false } }),
    ]);

    return {
      data,
      meta: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  markAsRead: async (userId: string, notificationId: string) => {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  },

  markAllAsRead: async (userId: string) => {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },
};
