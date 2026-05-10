import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';
import ApiError from '../utils/ApiError';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError("Không tìm thấy access token", 401);
    }

    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, env.JWT_ACCESS_SECRET, async (err: any, decoded: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return next(new ApiError("Token đã hết hạn", 401));
        } else {
          return next(new ApiError("Token không hợp lệ", 401));
        }
      }

      // Check DB realtime for banned status or VIP downgrade
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        return next(new ApiError("Người dùng không tồn tại", 401));
      }

      if (user.isBanned) {
        return next(new ApiError("Tài khoản đã bị khóa", 403));
      }

      // Downgrade VIP if expired
      let currentRole = user.role;
      if (currentRole === 'VIP' && user.vipExpiresAt && user.vipExpiresAt < new Date()) {
        currentRole = 'STANDARD';
        await prisma.user.update({ where: { id: user.id }, data: { role: 'STANDARD' } });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: currentRole,
      };

      next();
    });
  } catch (error) {
    next(error);
  }
};
