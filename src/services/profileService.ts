import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { deleteMediaByUrl } from '@/config/cloudinary';
import bcrypt from 'bcrypt';

export const profileService = {
  getProfile: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        targetScore: true,
        examDate: true,
        vipExpiresAt: true,
        createdAt: true,
      }
    });
    if (!user) throw new ApiError('User not found', StatusCodes.NOT_FOUND);
    return user;
  },

  updateProfile: async (userId: string, data: { name?: string; targetScore?: number; examDate?: Date }) => {
    if (data.name && data.name.length > 50) {
      throw new ApiError('Tên không được vượt quá 50 ký tự', StatusCodes.BAD_REQUEST);
    }
    if (data.targetScore) {
      if (data.targetScore < 10 || data.targetScore > 990 || data.targetScore % 5 !== 0) {
        throw new ApiError('Mục tiêu điểm không hợp lệ (10 - 990 và là bội số của 5)', StatusCodes.BAD_REQUEST);
      }
    }
    if (data.examDate && new Date(data.examDate) < new Date()) {
      throw new ApiError('Ngày thi dự kiến phải là một ngày trong tương lai', StatusCodes.BAD_REQUEST);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        targetScore: data.targetScore,
        examDate: data.examDate,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        targetScore: true,
        examDate: true,
      }
    });
    return updatedUser;
  },

  uploadAvatar: async (userId: string, newAvatarUrl: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError('User not found', StatusCodes.NOT_FOUND);

    if (user.avatarUrl) {
      await deleteMediaByUrl(user.avatarUrl, 'IMAGE');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: newAvatarUrl },
      select: { avatarUrl: true }
    });

    return updatedUser.avatarUrl;
  },

  changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError('User not found', StatusCodes.NOT_FOUND);

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) throw new ApiError('Mật khẩu hiện tại không chính xác', StatusCodes.BAD_REQUEST);

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash }
      });
      await tx.userSession.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false }
      });
    });
  },

  getStats: async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError('User not found', StatusCodes.NOT_FOUND);

    const joinedDays = Math.max(1, Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)));

    const results = await prisma.result.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { score: true, isFullTest: true, timeTaken: true }
    });

    const totalExams = results.length;
    let highestScore = 0;
    let totalStudyTime = 0;

    for (const result of results) {
      if (result.isFullTest && result.score > highestScore) {
        highestScore = result.score;
      }
      totalStudyTime += result.timeTaken;
    }

    const totalVocab = await prisma.vocab.count({ where: { userId } });
    const masteredVocab = await prisma.vocabSchedule.count({
      where: {
        vocab: { userId },
        status: 'MASTERED'
      }
    });

    return {
      totalExams,
      highestScore,
      totalVocab,
      masteredVocab,
      joinedDays,
      totalStudyTime,
    };
  },

  getMyNotes: async (userId: string) => {
    const notes = await prisma.questionNote.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            id: true,
            part: true,
            questionText: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return notes;
  },

  deleteAccount: async (userId: string, passwordConfirm: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError('User not found', StatusCodes.NOT_FOUND);

    const isValidPassword = await bcrypt.compare(passwordConfirm, user.passwordHash);
    if (!isValidPassword) throw new ApiError('Mật khẩu không chính xác', StatusCodes.BAD_REQUEST);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        }
      });

      await tx.userSession.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false }
      });
    });
  }
};
