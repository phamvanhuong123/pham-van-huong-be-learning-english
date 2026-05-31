import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { adminNotificationService } from '@/services/adminNotificationService';

export const adminNotificationController = {
  broadcast: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user!.id;
      const data = await adminNotificationService.broadcast(adminId, req.body);
      res.status(StatusCodes.OK).json({ message: 'Gửi thông báo thành công', data });
    } catch (error) {
      next(error);
    }
  },

  getBroadcasts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await adminNotificationService.getBroadcasts(req.query);
      res.status(StatusCodes.OK).json({ data });
    } catch (error) {
      next(error);
    }
  }
};
