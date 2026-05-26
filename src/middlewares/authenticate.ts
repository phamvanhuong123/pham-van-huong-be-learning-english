import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwtTokenHelper';
import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { env } from '@/config/environment';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError('Không có token xác thực', StatusCodes.UNAUTHORIZED);
    }
    const token = authHeader.split(' ')[1];

    // 2. Verify JWT
    const decoded = verifyToken(token, env.ACCESS_TOKEN_SECRET_SIGNATURE!) as any;

    // 3. Query DB — check isBanned + load permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        isBanned: true,
        isSuperAdmin: true,
        userRoles: {
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });

    if (!user) throw new ApiError('Người dùng không tồn tại', StatusCodes.UNAUTHORIZED);
    if (user.isBanned) throw new ApiError('Tài khoản đã bị khóa', StatusCodes.FORBIDDEN);

    // 4. Flatten permissions
    const permissions = user.userRoles.flatMap(ur =>
      ur.role.rolePermissions.map(rp => rp.permission.code)
    );

    // 5. Attach req.user
    req.user = {
      id: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      permissions
    };

    // 6. Update lastActiveAt async (không block request)
    prisma.userSession.updateMany({
      where: { userId: user.id, isActive: true },
      data: { lastActiveAt: new Date() }
    }).catch(() => {}); // ignore error, non-critical

    next();
  } catch (error) {
    next(error);
  }
};
