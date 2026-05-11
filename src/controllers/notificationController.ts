
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as notificationService from '../services/notificationService';


export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id as string;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

    const result = await notificationService.getNotifications(userId, page, limit);

    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id as string;

    const result = await notificationService.markAllAsRead(userId);

    res.status(StatusCodes.OK).json(result);
  } catch (err) {
    next(err);
  }
};
