import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { createAdminLog } from '@/utils/adminLogHelper';

export const adminTrashService = {
  getTrash: async (query: any) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const type = query.type || 'exam';

    let items: any[] = [];
    let total = 0;

    if (type === 'exam') {
      [items, total] = await Promise.all([
        prisma.exam.findMany({
          where: { isDeleted: true },
          skip,
          take: limit,
          orderBy: { deletedAt: 'desc' }
        }),
        prisma.exam.count({ where: { isDeleted: true } })
      ]);
    } else if (type === 'question') {
      [items, total] = await Promise.all([
        prisma.question.findMany({
          where: { isDeleted: true },
          skip,
          take: limit,
          orderBy: { deletedAt: 'desc' }
        }),
        prisma.question.count({ where: { isDeleted: true } })
      ]);
    }

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  restore: async (adminId: string, type: string, id: string) => {
    if (type === 'exam') {
      await prisma.exam.update({
        where: { id },
        data: { isDeleted: false, deletedAt: null }
      });
    } else if (type === 'question') {
      await prisma.question.update({
        where: { id },
        data: { isDeleted: false, deletedAt: null }
      });
    } else {
      throw new ApiError('Type không hợp lệ', StatusCodes.BAD_REQUEST);
    }

    await createAdminLog(prisma, {
      adminId,
      action: 'trash.restore',
      targetType: type,
      targetId: id
    });

    return { success: true };
  },

  hardDelete: async (adminId: string, type: string, id: string) => {
    if (type === 'exam') {
      await prisma.exam.delete({ where: { id } });
    } else if (type === 'question') {
      await prisma.question.delete({ where: { id } });
    } else {
      throw new ApiError('Type không hợp lệ', StatusCodes.BAD_REQUEST);
    }

    await createAdminLog(prisma, {
      adminId,
      action: 'trash.hard_delete',
      targetType: type,
      targetId: id
    });

    return { success: true };
  }
};
