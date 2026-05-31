import { Request, Response, NextFunction } from 'express';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

// Dùng SAU authenticate
// authorize('user.ban') — cần có 1 trong các permission
export const authorize = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return next(new ApiError('Chưa xác thực', StatusCodes.UNAUTHORIZED));
    }

    // SUPER_ADMIN bypass tất cả
    if (user.isSuperAdmin) return next();

    const hasPermission = requiredPermissions.some(p => user.permissions.includes(p));
    if (!hasPermission) {
      return next(new ApiError('Không có quyền thực hiện hành động này', StatusCodes.FORBIDDEN));
    }

    next();
  };
};
