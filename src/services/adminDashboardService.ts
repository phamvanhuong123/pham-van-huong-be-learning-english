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

    // Calculate chart data for the last 7 days
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const [usersCount, examsCount] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        }),
        prisma.result.count({
          where: {
            submittedAt: {
              gte: date,
              lt: nextDate
            }
          }
        })
      ]);

      const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      chartData.push({
        name: daysOfWeek[date.getDay()],
        users: usersCount,
        exams: examsCount
      });
    }

    return {
      stats: {
        totalUsers,
        totalExams,
        totalResults
      },
      chartData,
      recentActivity: recentLogs
    };
  }
};
