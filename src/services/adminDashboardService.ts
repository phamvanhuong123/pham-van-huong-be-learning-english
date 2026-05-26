import { prisma } from '@/config/prisma';

export const adminDashboardService = {
  getStats: async () => {
    const [totalUsers, totalExams, totalResults, recentLogs] = await Promise.all([
      prisma.user.count({ where: { isBanned: false } }).catch(() => prisma.user.count()),
      prisma.exam.count({ where: { isDeleted: false } }),
      prisma.result.count(),
      prisma.adminLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { name: true, email: true } } }
      })
    ]);

    return {
      stats: {
        totalUsers,
        totalExams,
        totalResults
      },
      recentActivity: recentLogs
    };
  }
};
