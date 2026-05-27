import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { notificationService } from '@/services/notificationService';

export const notificationController = {
  getMyNotifications: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await notificationService.getMyNotifications(req.user!.id, page, limit);
      res.status(StatusCodes.OK).json(data);
    } catch (error) {
      next(error);
    }
  },

  markAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };
      await notificationService.markAsRead(req.user!.id, id);
      res.status(StatusCodes.OK).json({ message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
      next(error);
    }
  },

  markAllAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await notificationService.markAllAsRead(req.user!.id);
      res.status(StatusCodes.OK).json({ message: 'Đã đánh dấu tất cả đã đọc' });
    } catch (error) {
      next(error);
    }
  },
};
