import prisma from '../config/database';
import { ProfileResponse, UpdateProfileBody } from '../types/profile';
import ApiError from '../utils/ApiError';
import { uploadImage, deleteImage, getPublicIdFromUrl } from '../utils/cloudinary';

export const getProfile = async (userId: string): Promise<ProfileResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name || '',
    avatarUrl: user.avatarUrl,
    targetScore: user.targetScore,
    examDate: user.examDate ? user.examDate.toISOString() : null,
    role: user.role,
    vipExpiresAt: user.vipExpiresAt ? user.vipExpiresAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  };
};

export const updateProfile = async (
  userId: string,
  body: UpdateProfileBody
): Promise<ProfileResponse> => {
  const { name, targetScore, examDate } = body;

  // Validation
  if (targetScore !== undefined && (targetScore < 10 || targetScore > 990)) {
    throw new ApiError('Target score must be between 10 and 990', 400);
  }

  if (examDate) {
    const date = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      throw new ApiError('Exam date cannot be in the past', 400);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      targetScore,
      examDate: examDate ? new Date(examDate) : undefined,
    },
  });

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name || '',
    avatarUrl: updatedUser.avatarUrl,
    targetScore: updatedUser.targetScore,
    examDate: updatedUser.examDate ? updatedUser.examDate.toISOString() : null,
    role: updatedUser.role,
    vipExpiresAt: updatedUser.vipExpiresAt ? updatedUser.vipExpiresAt.toISOString() : null,
    createdAt: updatedUser.createdAt.toISOString(),
  };
};

export const updateAvatar = async (
  userId: string,
  file: Express.Multer.File
): Promise<{ avatarUrl: string }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // 1. Upload new image to Cloudinary
  let uploadResult;
  try {
    uploadResult = await uploadImage(file, 'avatars');
  } catch (error) {
    throw new ApiError('Failed to upload image to Cloudinary', 500);
  }

  // 2. Delete old image from Cloudinary if exists
  if (user.avatarUrl) {
    const oldPublicId = getPublicIdFromUrl(user.avatarUrl);
    if (oldPublicId) {
      await deleteImage(oldPublicId);
    }
  }

  // 3. Update DB with new URL
  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: uploadResult.secure_url },
  });

  return { avatarUrl: uploadResult.secure_url };
};
