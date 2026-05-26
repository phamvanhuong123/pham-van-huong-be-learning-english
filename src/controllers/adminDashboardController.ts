import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { adminDashboardService } from '@/services/adminDashboardService';

export const adminDashboardController = {
  getStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await adminDashboardService.getStats();
      res.status(StatusCodes.OK).json({
        statusCode: StatusCodes.OK,
        message: "Lấy thống kê thành công",
        data
      });
    } catch (error) {
      next(error);
    }
  }
};
