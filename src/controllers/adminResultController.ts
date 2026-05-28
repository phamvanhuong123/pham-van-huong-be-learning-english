import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { adminResultService } from '@/services/adminResultService';

export const adminResultController = {
  getUserResults: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };
      const data = await adminResultService.getUserResults(id, req.query);
      res.status(StatusCodes.OK).json({
        statusCode: StatusCodes.OK,
        message: "Lấy lịch sử làm bài thành công",
        data
      });
    } catch (error) {
      next(error);
    }
  },

  getResultDetails: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };
      const data = await adminResultService.getResultDetails(id);
      res.status(StatusCodes.OK).json({
        statusCode: StatusCodes.OK,
        message: "Lấy chi tiết bài thi thành công",
        data
      });
    } catch (error) {
      next(error);
    }
  }
};
