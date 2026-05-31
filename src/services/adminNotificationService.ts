import { prisma } from '@/config/prisma';
import { emitToUser } from '@/config/socket';

export const adminNotificationService = {
  broadcast: async (adminId: string, data: { title: string; body: string; type: any; targetRole: string }) => {
    let users: any[] = [];
    if (data.targetRole === 'ALL') {
      users = await prisma.user.findMany({ where: { isBanned: false }, select: { id: true } });
    } else if (data.targetRole === 'STANDARD') {
      users = await prisma.user.findMany({
        where: {
          isBanned: false,
          OR: [
            { vipExpiresAt: null },
            { vipExpiresAt: { lt: new Date() } }
          ]
        },
        select: { id: true }
      });
    } else if (data.targetRole === 'VIP') {
      users = await prisma.user.findMany({
        where: {
          isBanned: false,
          vipExpiresAt: { gt: new Date() }
        },
        select: { id: true }
      });
    }


    users = users.filter(u => u.id !== adminId);

    const broadcast = await prisma.broadcast.create({
      data: {
        title: data.title,
        body: data.body,
        type: data.type || 'SYSTEM',
        targetRole: data.targetRole,
        sentBy: adminId
      }
    });

    if (users.length > 0) {
      const notificationData = users.map(u => ({
        userId: u.id,
        broadcastId: broadcast.id,
        title: broadcast.title,
        body: broadcast.body,
        type: broadcast.type
      }));

      await prisma.notification.createMany({
        data: notificationData
      });
      const emittedData = {
        id: broadcast.id,
        title: broadcast.title,
        body: broadcast.body,
        type: broadcast.type,
        createdAt: broadcast.createdAt
      };

      users.forEach(u => {
        emitToUser(u.id, 'new_notification', emittedData);
      });
    }

    return broadcast;
  },

  getBroadcasts: async (query: any) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [broadcasts, total] = await Promise.all([
      prisma.broadcast.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { name: true, email: true } },
          _count: { select: { notifications: true } }
        }
      }),
      prisma.broadcast.count()
    ]);

    return {
      broadcasts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
};
