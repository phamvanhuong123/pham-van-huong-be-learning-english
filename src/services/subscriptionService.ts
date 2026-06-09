import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { uploadToCloudinary, deleteMediaByUrl } from '@/config/cloudinary';
import { hashHelper } from '@/utils/hashHelper';
import { subscriptionRiskService } from './subscriptionRiskService';
import { createAdminLog } from '@/utils/adminLogHelper';
import { notificationService } from './notificationService';
import { emitToUser } from '@/config/socket';

export const subscriptionService = {
  createSubscription: async (userId: string, data: any, fileBuffer: Buffer) => {
    if (data.bankAccountNo) {
      const isBanned = await prisma.bannedBankAccount.findUnique({
        where: { bankAccountNo: data.bankAccountNo }
      });
      if (isBanned) {
        throw new ApiError('Số tài khoản này đã bị khóa do vi phạm', StatusCodes.FORBIDDEN);
      }
    }
    const proofHash = hashHelper.sha256(fileBuffer);

    const risk = await subscriptionRiskService.calculateRiskScore(
      userId,
      proofHash,
      data.bankAccountNo,
      data.ipAddress
    );


    const uploadResult = await uploadToCloudinary(fileBuffer, 'toeic/images', 'image');

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        plan: data.plan,
        amount: data.amount,
        bankAccountNo: data.bankAccountNo,
        transactionRef: data.transactionRef,
        proofUrl: uploadResult.url,
        proofHash,
        riskScore: risk.score,
        riskFlags: risk.flags,
        ipAddress: data.ipAddress,
        status: 'PENDING'
      }
    });

    return subscription;
  },

  getMySubscriptions: async (userId: string) => {
    return prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  },

  getAdminSubscriptionList: async (query: any) => {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { transactionRef: { contains: search, mode: 'insensitive' } },
        { bankAccountNo: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [total, data] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true, avatarUrl: true, vipExpiresAt: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  approveSubscription: async (adminId: string, subscriptionId: string, ipAddress?: string) => {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true }
    });

    if (!subscription) {
      throw new ApiError('Không tìm thấy yêu cầu', StatusCodes.NOT_FOUND);
    }
    if (subscription.status !== 'PENDING') {
      throw new ApiError('Chỉ có thể duyệt yêu cầu ở trạng thái PENDING', StatusCodes.BAD_REQUEST);
    }


    let months = 1;
    if (subscription.plan === 'VIP_3_MONTH') months = 3;
    if (subscription.plan === 'VIP_6_MONTH') months = 6;

    const now = new Date();
    const currentExpiry = subscription.user.vipExpiresAt;
    const startsAt = (currentExpiry && currentExpiry > now) ? currentExpiry : now;

    const expiresAt = new Date(startsAt);
    expiresAt.setMonth(expiresAt.getMonth() + months);
    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'APPROVED',
          approvedBy: adminId,
          approvedAt: new Date(),
          startsAt,
          expiresAt
        }
      });

      await tx.user.update({
        where: { id: subscription.userId },
        data: { vipExpiresAt: expiresAt }
      });

      return sub;
    });

    await createAdminLog(prisma, {
      adminId,
      action: 'subscription.approve',
      targetType: 'Subscription',
      targetId: subscriptionId,
      detail: { plan: subscription.plan, newExpiresAt: expiresAt },
      ipAddress
    });


    await notificationService.createNotification(
      subscription.userId,
      'Nâng cấp VIP thành công!',
      `Gói ${subscription.plan} của bạn đã được duyệt. Hạn sử dụng mới: ${expiresAt.toLocaleDateString('vi-VN')}`,
      'SUBSCRIPTION'
    );

    emitToUser(subscription.userId, 'vip_status_updated', { isVip: true });

    return updated;
  },

  rejectSubscription: async (adminId: string, subscriptionId: string, reason: string, ipAddress?: string) => {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription) {
      throw new ApiError('Không tìm thấy yêu cầu', StatusCodes.NOT_FOUND);
    }
    if (subscription.status !== 'PENDING') {
      throw new ApiError('Chỉ có thể từ chối yêu cầu ở trạng thái PENDING', StatusCodes.BAD_REQUEST);
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'REJECTED',
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason
      }
    });

    await createAdminLog(prisma, {
      adminId,
      action: 'subscription.reject',
      targetType: 'Subscription',
      targetId: subscriptionId,
      detail: { reason },
      ipAddress
    });

    // Thông báo realtime cho học viên
    await notificationService.createNotification(
      subscription.userId,
      'Yêu cầu nâng cấp bị từ chối',
      `Lý do: ${reason}`,
      'SUBSCRIPTION'
    );

    return updated;
  },

  banBankAccount: async (adminId: string, bankAccountNo: string, reason: string, ipAddress?: string) => {
    const existing = await prisma.bannedBankAccount.findUnique({
      where: { bankAccountNo }
    });
    if (existing) {
      throw new ApiError('Tài khoản ngân hàng này đã bị cấm', StatusCodes.BAD_REQUEST);
    }

    const banned = await prisma.bannedBankAccount.create({
      data: {
        bankAccountNo,
        reason,
        bannedBy: adminId
      }
    });

    await createAdminLog(prisma, {
      adminId,
      action: 'subscription.ban_account',
      targetType: 'BannedBankAccount',
      targetId: banned.id,
      detail: { bankAccountNo, reason },
      ipAddress
    });

    return banned;
  },

  editPendingSubscription: async (adminId: string, subscriptionId: string, data: { plan: string, amount: number }, ipAddress?: string) => {
    const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!subscription) throw new ApiError('Không tìm thấy yêu cầu', StatusCodes.NOT_FOUND);
    if (subscription.status !== 'PENDING') throw new ApiError('Chỉ có thể sửa yêu cầu ở trạng thái PENDING', StatusCodes.BAD_REQUEST);

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { plan: data.plan, amount: data.amount }
    });

    await createAdminLog(prisma, {
      adminId,
      action: 'subscription.edit',
      targetType: 'Subscription',
      targetId: subscriptionId,
      detail: { oldPlan: subscription.plan, newPlan: data.plan, oldAmount: subscription.amount, newAmount: data.amount },
      ipAddress
    });

    return updated;
  },

  revokeSubscription: async (adminId: string, subscriptionId: string, reason: string, ipAddress?: string) => {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true }
    });
    if (!subscription) throw new ApiError('Không tìm thấy yêu cầu', StatusCodes.NOT_FOUND);
    if (subscription.status !== 'APPROVED') throw new ApiError('Chỉ có thể thu hồi yêu cầu đã APPROVED', StatusCodes.BAD_REQUEST);

    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'REVOKED',
          rejectedBy: adminId,
          rejectedAt: new Date(),
          rejectionReason: reason
        }
      });
      await tx.user.update({
        where: { id: subscription.userId },
        data: { vipExpiresAt: null }
      });
      return sub;
    });

    await createAdminLog(prisma, {
      adminId,
      action: 'subscription.revoke',
      targetType: 'Subscription',
      targetId: subscriptionId,
      detail: { reason },
      ipAddress
    });

    emitToUser(subscription.userId, 'session_kicked', {});

    return updated;
  },

  deleteSubscription: async (adminId: string, subscriptionId: string, ipAddress?: string) => {
    const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!subscription) throw new ApiError('Không tìm thấy yêu cầu', StatusCodes.NOT_FOUND);
    if (subscription.status === 'APPROVED') throw new ApiError('Không thể xóa yêu cầu đã APPROVED', StatusCodes.BAD_REQUEST);

    if (subscription.proofUrl) {
      await deleteMediaByUrl(subscription.proofUrl, 'IMAGE');
    }

    await prisma.subscription.delete({ where: { id: subscriptionId } });

    await createAdminLog(prisma, {
      adminId,
      action: 'subscription.delete',
      targetType: 'Subscription',
      targetId: subscriptionId,
      detail: { deletedPlan: subscription.plan },
      ipAddress
    });

    return { success: true };
  },

  getBannedBankAccounts: async () => {
    return prisma.bannedBankAccount.findMany({
      include: { admin: { select: { name: true, email: true } } },
      orderBy: { bannedAt: 'desc' }
    });
  },

  unbanBankAccount: async (adminId: string, id: string, ipAddress?: string) => {
    const banned = await prisma.bannedBankAccount.findUnique({ where: { id } });
    if (!banned) throw new ApiError('Không tìm thấy tài khoản', StatusCodes.NOT_FOUND);

    await prisma.bannedBankAccount.delete({ where: { id } });

    await createAdminLog(prisma, {
      adminId,
      action: 'subscription.unban_account',
      targetType: 'BannedBankAccount',
      targetId: id,
      detail: { bankAccountNo: banned.bankAccountNo },
      ipAddress
    });

    return { success: true };
  }
};
