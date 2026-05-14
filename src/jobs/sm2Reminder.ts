/**
 * sm2Reminder.ts — Cron Job nhắc nhở ôn từ vựng SM-2
 *
 * Schedule: 07:00 mỗi ngày (Asia/Ho_Chi_Minh)
 * Logic:
 *   1. Query tất cả VocabSchedule có nextReviewAt <= hôm nay (end of day)
 *   2. Group by userId → đếm số từ cần ôn
 *   3. Tạo Notification trong DB
 *   4. Gửi email nhắc nhở (fire-and-forget, không throw)
 *
 * Edge Cases:
 *   - User không có từ nào due → không tạo notification, không gửi email
 *   - Email gửi lỗi → log lỗi, cron tiếp tục chạy (không crash)
 *   - DB lỗi → catch toàn bộ job, log lỗi, không crash server
 */

import cron from 'node-cron';
import prisma from '../config/database';
import { sendVocabReminderEmail } from '../services/emailService';

interface UserReminderData {
  email: string;
  name: string;
  count: number;
}

// Schedule: 07:00 mỗi ngày, timezone Asia/Ho_Chi_Minh
cron.schedule(
  '0 7 * * *',
  async () => {
    console.log('[SM2Reminder] Cron job bắt đầu chạy...');

    try {
      // End of today theo giờ local (UTC+7)
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Query tất cả schedules due hôm nay, kèm thông tin user
      const dueSchedules = await prisma.vocabSchedule.findMany({
        where: {
          nextReviewAt: { lte: todayEnd },
        },
        select: {
          vocab: {
            select: {
              userId: true,
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (dueSchedules.length === 0) {
        console.log('🔔 [SM2Reminder] Không có từ nào cần ôn hôm nay.');
        return;
      }

      // Group by userId — đếm số từ cần ôn per user
      const userMap = new Map<string, UserReminderData>();

      for (const schedule of dueSchedules) {
        const { userId, user } = schedule.vocab;
        
        if (!userId || !user) continue;

        const existing = userMap.get(userId);

        if (existing) {
          existing.count++;
        } else {
          userMap.set(userId, {
            email: user.email,
            name: user.name ?? 'Bạn',
            count: 1,
          });
        }
      }

      console.log(`🔔 [SM2Reminder] Tìm thấy ${userMap.size} user cần nhắc nhở.`);

      // Tạo Notification + gửi email cho từng user
      const tasks: Promise<void>[] = [];

      for (const [userId, { email, name, count }] of userMap) {
        const task = (async () => {
          try {
            // Tạo Notification trong DB
            await prisma.notification.create({
              data: {
                userId,
                title: 'Ôn từ vựng hôm nay 📚',
                body: `Bạn có ${count} từ vựng cần ôn theo lịch SM-2. Đừng bỏ lỡ!`,
              },
            });

            // Gửi email nhắc nhở (fire-and-forget)
            await sendVocabReminderEmail({ to: email, name, count });

            console.log(`✅ [SM2Reminder] Đã nhắc nhở user ${email} (${count} từ)`);
          } catch (err) {
            // Không throw — lỗi 1 user không ảnh hưởng các user khác
            console.error(`❌ [SM2Reminder] Lỗi khi xử lý user ${email}:`, err);
          }
        })();

        tasks.push(task);
      }

      // Chạy song song (Promise.allSettled để không bị block nếu 1 task lỗi)
      await Promise.allSettled(tasks);

      console.log('🔔 [SM2Reminder] Cron job hoàn thành.');
    } catch (err) {
      // Catch toàn bộ job — không crash server
      console.error('❌ [SM2Reminder] Cron job bị lỗi nghiêm trọng:', err);
    }
  },
  {
    timezone: 'Asia/Ho_Chi_Minh',
  }
);

console.log('🕐 [SM2Reminder] Cron job đã được đăng ký — chạy lúc 07:00 Asia/Ho_Chi_Minh mỗi ngày.');
