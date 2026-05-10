import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';

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
      res.status(401).json({ message: "Không tìm thấy access token" });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, env.JWT_ACCESS_SECRET, async (err: any, decoded: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          res.status(401).json({ code: 'TOKEN_EXPIRED', message: "Token đã hết hạn" });
        } else {
          res.status(401).json({ message: "Token không hợp lệ" });
        }
        return;
      }

      // Check DB realtime for banned status or VIP downgrade
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        res.status(401).json({ message: "Người dùng không tồn tại" });
        return;
      }

      if (user.isBanned) {
        res.status(403).json({ message: "Tài khoản đã bị khóa" });
        return;
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
