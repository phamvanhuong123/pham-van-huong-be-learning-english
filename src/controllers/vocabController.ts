import { Request, Response, NextFunction } from 'express';
import { vocabService } from '@/services/vocabService';
import { StatusCodes } from 'http-status-codes';
import { createVocabSchema, updateVocabSchema, queryVocabSchema } from '@/validators/vocabValidator';

export const vocabController = {
  getVocabList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = queryVocabSchema.parse(req.query);
      const result = await vocabService.getVocabList(req.user!.id, query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  },

  getVocabById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vocab = await vocabService.getVocabById(req.params.id as string, req.user!.id);
      res.status(StatusCodes.OK).json(vocab);
    } catch (error) {
      next(error);
    }
  },

  createVocab: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createVocabSchema.parse(req.body);
      const vocab = await vocabService.createVocab(req.user!.id, data);
      res.status(StatusCodes.CREATED).json(vocab);
    } catch (error) {
      next(error);
    }
  },

  updateVocab: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateVocabSchema.parse(req.body);
      const vocab = await vocabService.updateVocab(req.params.id as string, req.user!.id, data);
      res.status(StatusCodes.OK).json(vocab);
    } catch (error) {
      next(error);
    }
  },

  deleteVocab: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await vocabService.deleteVocab(req.params.id as string, req.user!.id);
      res.status(StatusCodes.OK).json({ message: 'Xóa từ vựng thành công' });
    } catch (error) {
      next(error);
    }
  },

  getVocabStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await vocabService.getVocabStats(req.user!.id);
      res.status(StatusCodes.OK).json(stats);
    } catch (error) {
      next(error);
    }
  }
};
