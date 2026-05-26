import { prisma } from '@/config/prisma';

export const adminLogService = {
  getLogs: async (query: any) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.action) {
      where.action = query.action;
    }
    if (query.targetType) {
      where.targetType = query.targetType;
    }
    if (query.adminId) {
      where.adminId = query.adminId;
    }

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { name: true, email: true } }
        }
      }),
      prisma.adminLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
};
