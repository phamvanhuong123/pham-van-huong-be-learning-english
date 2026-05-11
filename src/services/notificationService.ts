import prisma from '../config/database';
import type { NotificationListResponse, ReadAllResponse } from '../types/notification';

export const getNotifications = async (
  userId: string,
  page: number,
  limit: number
): Promise<NotificationListResponse> => {
  const skip = (page - 1) * limit;

  // Chạy song song: lấy danh sách + đếm unread
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        body: true,
        isRead: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return { notifications, unreadCount };
};


export const markAllAsRead = async (userId: string): Promise<ReadAllResponse> => {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { updated: result.count };
};
