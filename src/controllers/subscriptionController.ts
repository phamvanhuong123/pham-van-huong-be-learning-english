import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as subscriptionService from '../services/subscriptionService';
import ApiError from '../utils/ApiError';

export const createRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { plan } = req.body;
    const file = req.file;

    if (!plan) {
      throw new ApiError('Vui lòng chọn gói VIP', StatusCodes.BAD_REQUEST);
    }

    if (!file) {
      throw new ApiError('Vui lòng tải lên ảnh bằng chứng chuyển khoản', StatusCodes.BAD_REQUEST);
    }

    const result = await subscriptionService.createSubscriptionRequest(userId, plan, file);
    res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMyHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const history = await subscriptionService.getMySubscriptions(userId);
    res.status(StatusCodes.OK).json(history);
  } catch (error) {
    next(error);
  }
};

export const getPendingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const pending = await subscriptionService.getLatestPendingRequest(userId);
    res.status(StatusCodes.OK).json(pending);
  } catch (error) {
    next(error);
  }
};
