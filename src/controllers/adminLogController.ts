import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { adminLogService } from '@/services/adminLogService';

export const adminLogController = {
  getLogs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await adminLogService.getLogs(req.query);
      res.status(StatusCodes.OK).json({ data });
    } catch (error) {
      next(error);
    }
  }
};
