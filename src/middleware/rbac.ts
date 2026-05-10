import { Request, Response, NextFunction } from 'express';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Bạn cần đăng nhập để thực hiện hành động này" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Bạn không có quyền truy cập chức năng này" });
      return;
    }

    next();
  };
};
