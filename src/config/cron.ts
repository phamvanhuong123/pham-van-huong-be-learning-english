import cron from 'node-cron';
import { prisma } from '@/config/prisma';
import { createAdminLog } from '@/utils/adminLogHelper';

export const initCronJobs = () => {

  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('Bắt đầu dọn dẹp thùng rác (auto-purge)...');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);


      const { count: examCount } = await prisma.exam.deleteMany({
        where: {
          isDeleted: true,
          deletedAt: { lte: thirtyDaysAgo }
        }
      });

      const { count: questionCount } = await prisma.question.deleteMany({
        where: {
          isDeleted: true,
          deletedAt: { lte: thirtyDaysAgo }
        }
      });

      console.log(`Đã dọn dẹp: ${examCount} exams, ${questionCount} questions.`);

      if (examCount > 0 || questionCount > 0) {
        // Hệ thống sẽ đóng vai trò là admin
        await createAdminLog(prisma, {
          adminId: 'system', // Có thể để chuỗi system
          action: 'trash.auto_purge',
          targetType: 'System',
          detail: { examCount, questionCount }
        });
      }

    } catch (error) {
      console.error('Lỗi khi chạy cron dọn dẹp thùng rác:', error);
    }
  });

  // Check subscription expiry at 0:00 AM every day
  cron.schedule('0 0 * * *', async () => {
    const { checkSubscriptionExpiry } = await import('@/jobs/subscriptionExpiryJob');
    await checkSubscriptionExpiry();
  });

  // Cleanup abandoned study sessions at 3:00 AM every day
  cron.schedule('0 3 * * *', async () => {
    const { cleanupAbandonedSessions } = await import('@/jobs/cleanupJob');
    await cleanupAbandonedSessions();
  });

  // Send vocab review reminders at 8:00 AM every day
  cron.schedule('0 8 * * *', async () => {
    const { sendVocabReviewReminders } = await import('@/jobs/vocabReminderJob');
    await sendVocabReviewReminders();
  });

  console.log('Đã khởi tạo các Cron Jobs.');
};
