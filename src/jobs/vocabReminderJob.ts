import { prisma } from '@/config/prisma';
import { NotificationType, VocabStatus } from '../../generated/prisma/client';
import dayjs from 'dayjs';

export const sendVocabReviewReminders = async () => {
  try {
    const today = dayjs().endOf('day').toDate();

    // Group by userId để xem mỗi user có bao nhiêu từ cần ôn hôm nay
    const dueVocabs = await prisma.vocabSchedule.groupBy({
      by: ['vocabId'],
      where: {
        nextReviewAt: { lte: today },
        status: { in: [VocabStatus.LEARNING, VocabStatus.REVIEW] }
      },
    });

    if (dueVocabs.length === 0) {
      console.log('[Cron] No vocab reviews due today.');
      return;
    }

    // Prisma groupBy hiện tại không hỗ trợ lấy quan hệ dễ dàng, ta sẽ dùng query thô hoặc gom nhóm bằng code
    // Lấy danh sách vocab đến hạn ôn
    const dueSchedules = await prisma.vocabSchedule.findMany({
      where: {
        nextReviewAt: { lte: today },
        status: { in: [VocabStatus.LEARNING, VocabStatus.REVIEW] }
      },
      include: {
        vocab: {
          select: { userId: true }
        }
      }
    });

    const userDueCounts: Record<string, number> = {};
    for (const schedule of dueSchedules) {
      if (schedule.vocab.userId) {
        userDueCounts[schedule.vocab.userId] = (userDueCounts[schedule.vocab.userId] || 0) + 1;
      }
    }

    console.log(`[Cron] Found ${dueSchedules.length} due vocabs across ${Object.keys(userDueCounts).length} users. Sending reminders...`);

    const notifications = Object.entries(userDueCounts).map(([userId, count]) => ({
      userId,
      title: 'Đã đến giờ ôn tập từ vựng!',
      body: `Bạn có ${count} từ vựng cần ôn tập hôm nay theo lịch trình Spaced Repetition. Hãy vào học ngay để giữ chuỗi nhé!`,
      type: NotificationType.VOCAB_REMINDER
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      });
    }

    console.log('[Cron] Vocab review reminders sent successfully.');
  } catch (error) {
    console.error('[Cron] Error sending vocab reminders:', error);
  }
};
