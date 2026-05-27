import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { uploadToCloudinary } from '@/config/cloudinary';
import { hashHelper } from '@/utils/hashHelper';
import { subscriptionRiskService } from './subscriptionRiskService';
import { createAdminLog } from '@/utils/adminLogHelper';
import { notificationService } from './notificationService';

export const subscriptionService = {
  createSubscription: async (userId: string, data: any, fileBuffer: Buffer) => {
    // 1. Calculate proofHash
    const proofHash = hashHelper.sha256(fileBuffer);

    // 2. Calculate risk score
    const risk = await subscriptionRiskService.calculateRiskScore(
      userId, 
      proofHash, 
      data.bankAccountNo, 
      data.ipAddress
    );

    // 3. Upload image to Cloudinary
    // @ts-ignore
    const uploadResult = await uploadToCloudinary(fileBuffer, 'toeic/images', 'image');
    
    // 4. Create record
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

    // Calculate expiration
    let months = 1;
    if (subscription.plan === 'VIP_3_MONTH') months = 3;
    if (subscription.plan === 'VIP_6_MONTH') months = 6;

    const now = new Date();
    // If user is already VIP, extend from current expiry. Else from now.
    const currentExpiry = subscription.user.vipExpiresAt;
    const startsAt = (currentExpiry && currentExpiry > now) ? currentExpiry : now;
    
    const expiresAt = new Date(startsAt);
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Transaction
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

    // Thông báo realtime cho học viên
    await notificationService.createNotification(
      subscription.userId,
      'Nâng cấp VIP thành công!',
      `Gói ${subscription.plan} của bạn đã được duyệt. Hạn sử dụng mới: ${expiresAt.toLocaleDateString('vi-VN')}`,
      'SUBSCRIPTION'
    );

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
  }
};
