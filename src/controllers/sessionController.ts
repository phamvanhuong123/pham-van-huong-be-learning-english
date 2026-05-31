import { Request, Response, NextFunction } from 'express';
import { sessionService } from '@/services/sessionService';
import { StatusCodes } from 'http-status-codes';

export const sessionController = {
  getSessions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentSessionId = req.cookies?.sessionId;
      const sessions = await sessionService.getSessions(req.user!.id, currentSessionId);
      res.status(StatusCodes.OK).json({ data: sessions });
    } catch (error) {
      next(error);
    }
  },

  revokeAllOther: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentSessionId = req.cookies?.sessionId;
      const count = await sessionService.revokeAllOther(req.user!.id, currentSessionId);
      res.status(StatusCodes.OK).json({ message: `Đã đăng xuất ${count} thiết bị khác.` });
    } catch (error) {
      next(error);
    }
  },

  revokeOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };
      const currentSessionId = req.cookies?.sessionId;
      await sessionService.revokeOne(req.user!.id, id, currentSessionId);
      res.status(StatusCodes.OK).json({ message: 'Đã đăng xuất thiết bị.' });
    } catch (error) {
      next(error);
    }
  }
};
