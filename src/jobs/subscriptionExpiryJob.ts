import { prisma } from '@/config/prisma';
import { NotificationType } from '../../generated/prisma/client';

export const checkSubscriptionExpiry = async () => {
  try {
    const now = new Date();

    // 1. Tìm các gói VIP đã APPROVED và hết hạn
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'APPROVED',
        expiresAt: {
          lt: now
        }
      },
      include: {
        user: true
      }
    });

    if (expiredSubscriptions.length === 0) {
      console.log('[Cron] No expired subscriptions found.');
      return;
    }

    console.log(`[Cron] Found ${expiredSubscriptions.length} expired subscriptions. Processing...`);

    for (const sub of expiredSubscriptions) {
      // 2. Đánh dấu gói VIP này là HẾT HẠN (Có thể để nguyên APPROVED và chỉ check expiresAt, 
      // nhưng để rõ ràng ta nên xoá cờ VIP của User)
      // Wait, trong schema User không có role VIP mà quản lý qua `vipExpiresAt`.
      
      // Kiểm tra xem User còn gói VIP nào khác đang active không (tránh trường hợp họ mua gộp gói)
      const latestActiveVip = await prisma.subscription.findFirst({
        where: {
          userId: sub.userId,
          status: 'APPROVED',
          expiresAt: { gt: now }
        }
      });

      // Nếu không còn gói nào active thì set vipExpiresAt về null
      if (!latestActiveVip) {
        await prisma.user.update({
          where: { id: sub.userId },
          data: { vipExpiresAt: null }
        });

        // 3. Gửi thông báo cho User
        await prisma.notification.create({
          data: {
            userId: sub.userId,
            title: 'Gói VIP của bạn đã hết hạn',
            body: `Gói ${sub.plan} của bạn đã hết hạn. Hãy gia hạn để tiếp tục sử dụng các tính năng cao cấp nhé!`,
            type: NotificationType.SUBSCRIPTION
          }
        });
      }
    }

    console.log('[Cron] Subscription expiry check completed.');
  } catch (error) {
    console.error('[Cron] Error checking subscription expiry:', error);
  }
};
