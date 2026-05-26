import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { adminUserService } from '@/services/adminUserService';

export const adminUserController = {
  getUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await adminUserService.getUsers(req.query);
      res.status(StatusCodes.OK).json({ data });
    } catch (error) {
      next(error);
    }
  },

  getUserById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const data = await adminUserService.getUserById(id);
      res.status(StatusCodes.OK).json({ data });
    } catch (error) {
      next(error);
    }
  },

  banUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user!.id;
      const id = req.params.id as string;
      const { isBanned, reason } = req.body;
      const data = await adminUserService.banUser(adminId, id, isBanned, reason);
      res.status(StatusCodes.OK).json({ message: isBanned ? 'Khóa tài khoản thành công' : 'Mở khóa tài khoản thành công', data });
    } catch (error) {
      next(error);
    }
  },

  updateRole: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user!.id;
      const id = req.params.id as string;
      const { role } = req.body;
      const data = await adminUserService.updateRole(adminId, id, role);
      res.status(StatusCodes.OK).json({ message: 'Cập nhật role thành công', data });
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user!.id;
      const id = req.params.id as string;
      const data = await adminUserService.resetPassword(adminId, id);
      res.status(StatusCodes.OK).json({ message: 'Đã gửi link reset mật khẩu tới email người dùng', data });
    } catch (error) {
      next(error);
    }
  },

  kickAllSessions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user!.id;
      const id = req.params.id as string;
      const data = await adminUserService.kickAllSessions(adminId, id);
      res.status(StatusCodes.OK).json({ message: 'Đã kick toàn bộ phiên đăng nhập', data });
    } catch (error) {
      next(error);
    }
  }
};
