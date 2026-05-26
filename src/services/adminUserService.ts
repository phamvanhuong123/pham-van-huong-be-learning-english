import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { createAdminLog } from '@/utils/adminLogHelper';
import bcrypt from 'bcrypt';
import { emailService } from '@/services/emailService';
import { generateRandomToken } from '@/utils/generateRandom';

export const adminUserService = {
  getUsers: async (query: any) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    if (query.status === 'BANNED') {
      where.isBanned = true;
    } else if (query.status === 'ACTIVE') {
      where.isBanned = false;
    }

    if (query.role) {
      where.userRoles = { some: { role: { name: query.role } } };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          emailVerified: true,
          isBanned: true,
          phoneVerified: true,
          registrationIp: true,
          createdAt: true,
          vipExpiresAt: true,
          userRoles: { include: { role: { select: { name: true } } } },
          _count: { select: { sessions: { where: { isActive: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  getUserById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: { include: { role: true } },
        sessions: { where: { isActive: true }, orderBy: { lastActiveAt: 'desc' } },
        results: { take: 5, orderBy: { submittedAt: 'desc' } }
      }
    });

    if (!user) throw new ApiError('User not found', StatusCodes.NOT_FOUND);

    return user;
  },

  banUser: async (adminId: string, id: string, isBanned: boolean, reason?: string) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError('User not found', StatusCodes.NOT_FOUND);
    if (user.isSuperAdmin && isBanned) {
      throw new ApiError('Không thể ban Super Admin', StatusCodes.FORBIDDEN);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { isBanned }
      });

      if (isBanned) {
        await tx.userSession.updateMany({
          where: { userId: id, isActive: true },
          data: { isActive: false }
        });
      }

      await createAdminLog(tx, {
        adminId,
        action: isBanned ? 'user.ban' : 'user.unban',
        targetType: 'User',
        targetId: id,
        detail: { reason }
      });
    });

    return { success: true };
  },

  updateRole: async (adminId: string, id: string, roleName: string) => {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new ApiError('Role not found', StatusCodes.NOT_FOUND);

    await prisma.$transaction(async (tx) => {
      // For simplicity, we just clear old roles and set the new one,
      // Or we can just upsert. Assuming 1 main role per user.
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.create({
        data: {
          userId: id,
          roleId: role.id,
          grantedBy: adminId
        }
      });

      await createAdminLog(tx, {
        adminId,
        action: 'user.update_role',
        targetType: 'User',
        targetId: id,
        detail: { newRole: roleName }
      });
    });

    return { success: true };
  },

  resetPassword: async (adminId: string, id: string) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError('User not found', StatusCodes.NOT_FOUND);

    const { hashedToken, token } = generateRandomToken();
    
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          resetPasswordToken: hashedToken,
          resetPasswordExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      await tx.userSession.updateMany({
        where: { userId: id, isActive: true },
        data: { isActive: false }
      });

      await createAdminLog(tx, {
        adminId,
        action: 'user.force_reset_password',
        targetType: 'User',
        targetId: id
      });
    });

    // Send email
    await emailService.sendPasswordResetEmail(user.email, user.name || "Bạn", token);

    return { success: true };
  },

  kickAllSessions: async (adminId: string, id: string) => {
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.userSession.updateMany({
        where: { userId: id, isActive: true },
        data: { isActive: false }
      });

      await createAdminLog(tx, {
        adminId,
        action: 'user.kick_sessions',
        targetType: 'User',
        targetId: id,
        detail: { kickedCount: count }
      });
    });

    return { success: true };
  }
};
