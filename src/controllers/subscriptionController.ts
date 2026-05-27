import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '@/services/subscriptionService';
import { StatusCodes } from 'http-status-codes';
import { createSubscriptionSchema, rejectSubscriptionSchema, querySubscriptionSchema } from '@/validators/subscriptionValidator';
import ApiError from '@/utils/ApiError';

export const subscriptionController = {
  createSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;
      const imageFile = files?.['image']?.[0];

      if (!imageFile) {
        throw new ApiError('Vui lòng upload ảnh chụp màn hình chuyển khoản', StatusCodes.BAD_REQUEST);
      }
      
      const data = createSubscriptionSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      
      const subscription = await subscriptionService.createSubscription(req.user!.id, { ...data, ipAddress }, imageFile.buffer);
      res.status(StatusCodes.CREATED).json({ data: subscription });
    } catch (error) {
      next(error);
    }
  },

  getMySubscriptions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscriptions = await subscriptionService.getMySubscriptions(req.user!.id);
      res.status(StatusCodes.OK).json({ data: subscriptions });
    } catch (error) {
      next(error);
    }
  },

  getAdminSubscriptionList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = querySubscriptionSchema.parse(req.query);
      const result = await subscriptionService.getAdminSubscriptionList(query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  },

  approveSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const updated = await subscriptionService.approveSubscription(req.user!.id, req.params.id as string, ipAddress);
      res.status(StatusCodes.OK).json({ data: updated, message: 'Đã phê duyệt yêu cầu nâng cấp' });
    } catch (error) {
      next(error);
    }
  },

  rejectSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = rejectSubscriptionSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const updated = await subscriptionService.rejectSubscription(req.user!.id, req.params.id as string, data.reason, ipAddress);
      res.status(StatusCodes.OK).json({ data: updated, message: 'Đã từ chối yêu cầu nâng cấp' });
    } catch (error) {
      next(error);
    }
  },

  banBankAccount: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bankAccountNo, reason } = req.body;
      if (!bankAccountNo) {
        throw new ApiError('bankAccountNo là bắt buộc', StatusCodes.BAD_REQUEST);
      }
      const ipAddress = req.ip || req.socket.remoteAddress;
      const banned = await subscriptionService.banBankAccount(req.user!.id, bankAccountNo, reason, ipAddress);
      res.status(StatusCodes.CREATED).json({ data: banned, message: 'Đã chặn tài khoản ngân hàng' });
    } catch (error) {
      next(error);
    }
  }
};
