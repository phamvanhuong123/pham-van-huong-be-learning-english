import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboardService';
import { StatusCodes } from 'http-status-codes';

export const getDashboardData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const data = await dashboardService.getDashboardData(userId);
    res.status(StatusCodes.OK).json(data);
  } catch (error) {
    next(error);
  }
};
