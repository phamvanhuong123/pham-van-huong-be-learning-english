import { StatusCodes } from 'http-status-codes';
import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { uploadImage } from '../utils/cloudinary';
import { SubscriptionResponse } from '../types/subscription';

export const createSubscriptionRequest = async (
  userId: string,
  plan: string,
  file: Express.Multer.File
): Promise<SubscriptionResponse> => {
  // 1. Kiểm tra xem người dùng đã có yêu cầu PENDING nào chưa
  const existingPending = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'PENDING',
    },
  });

  if (existingPending) {
    throw new ApiError(
      'Bạn đã có một yêu cầu đang chờ xử lý. Vui lòng đợi quản trị viên duyệt.',
      StatusCodes.CONFLICT
    );
  }

  // 2. Upload ảnh bằng chứng lên Cloudinary
  let uploadResult;
  try {
    uploadResult = await uploadImage(file, 'subscriptions');
  } catch (error) {
    throw new ApiError('Không thể tải lên ảnh bằng chứng. Vui lòng thử lại.', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  // 3. Tạo record Subscription
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      plan,
      proofUrl: uploadResult.secure_url,
      status: 'PENDING',
    },
  });

  return {
    ...subscription,
    startsAt: subscription.startsAt ? subscription.startsAt.toISOString() : null,
    expiresAt: subscription.expiresAt ? subscription.expiresAt.toISOString() : null,
    createdAt: subscription.createdAt.toISOString(),
    updatedAt: subscription.updatedAt.toISOString(),
  };
};

export const getMySubscriptions = async (userId: string): Promise<SubscriptionResponse[]> => {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return subscriptions.map((s) => ({
    ...s,
    startsAt: s.startsAt ? s.startsAt.toISOString() : null,
    expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));
};

export const getLatestPendingRequest = async (userId: string): Promise<SubscriptionResponse | null> => {
  const s = await prisma.subscription.findFirst({
    where: { userId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  if (!s) return null;

  return {
    ...s,
    startsAt: s.startsAt ? s.startsAt.toISOString() : null,
    expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
};
