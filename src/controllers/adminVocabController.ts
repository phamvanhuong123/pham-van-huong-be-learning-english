import { Request, Response, NextFunction } from 'express';
import { adminVocabService } from '@/services/adminVocabService';
import { StatusCodes } from 'http-status-codes';
import { createVocabSchema, updateVocabSchema, queryVocabSchema } from '@/validators/vocabValidator';
import ApiError from '@/utils/ApiError';

export const adminVocabController = {
  getSystemVocabs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = queryVocabSchema.parse(req.query);
      const result = await adminVocabService.getSystemVocabs(query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  },

  createSystemVocab: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createVocabSchema.parse(req.body);
      const vocab = await adminVocabService.createSystemVocab(data);
      res.status(StatusCodes.CREATED).json(vocab);
    } catch (error) {
      next(error);
    }
  },

  updateSystemVocab: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateVocabSchema.parse(req.body);
      const vocab = await adminVocabService.updateSystemVocab(req.params.id as string, data);
      res.status(StatusCodes.OK).json(vocab);
    } catch (error) {
      next(error);
    }
  },

  deleteSystemVocab: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminVocabService.deleteSystemVocab(req.params.id as string);
      res.status(StatusCodes.OK).json({ message: 'Xóa từ vựng hệ thống thành công' });
    } catch (error) {
      next(error);
    }
  },

  importCsv: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ApiError('Vui lòng upload file CSV', StatusCodes.BAD_REQUEST);
      }
      const { vocabImportService } = await import('@/services/vocabImportService');
      const result = await vocabImportService.importCsv(null, req.file.buffer); // userId = null
      res.status(StatusCodes.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
};
