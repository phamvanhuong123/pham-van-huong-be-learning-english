import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import { StatusCodes } from 'http-status-codes';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError("Bạn cần đăng nhập để thực hiện hành động này", StatusCodes.UNAUTHORIZED);
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError("Bạn không có quyền truy cập chức năng này", StatusCodes.FORBIDDEN);
    }

    next();
  };
};
