import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { adminTrashService } from '@/services/adminTrashService';

export const adminTrashController = {
  getTrash: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await adminTrashService.getTrash(req.query);
      res.status(StatusCodes.OK).json({ data });
    } catch (error) {
      next(error);
    }
  },

  restore: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user!.id;
      const type = req.params.type as string;
      const id = req.params.id as string;
      const data = await adminTrashService.restore(adminId, type, id);
      res.status(StatusCodes.OK).json({ message: 'Khôi phục bản ghi thành công', data });
    } catch (error) {
      next(error);
    }
  },

  hardDelete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user!.id;
      const type = req.params.type as string;
      const id = req.params.id as string;
      const data = await adminTrashService.hardDelete(adminId, type, id);
      res.status(StatusCodes.OK).json({ message: 'Đã xoá vĩnh viễn', data });
    } catch (error) {
      next(error);
    }
  }
};
