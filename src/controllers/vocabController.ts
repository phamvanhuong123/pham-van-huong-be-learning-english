import { Request, Response, NextFunction } from 'express';
import { vocabService } from '@/services/vocabService';
import { vocabImportService } from '@/services/vocabImportService';
import { StatusCodes } from 'http-status-codes';
import { createVocabSchema, updateVocabSchema, queryVocabSchema } from '@/validators/vocabValidator';
import ApiError from '@/utils/ApiError';
import { vocabSrsService } from '@/services/vocabSrsService';
import { previewNextIntervals } from '@/utils/srsAlgorithm';

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
      res.status(StatusCodes.OK).json({ data: vocab });
    } catch (error) {
      next(error);
    }
  },

  createVocab: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createVocabSchema.parse(req.body);
      const audioFile = req.files && !Array.isArray(req.files) ? req.files['audio']?.[0] : undefined;
      const vocab = await vocabService.createVocab(req.user!.id, data, audioFile);
      res.status(StatusCodes.CREATED).json({ data: vocab });
    } catch (error) {
      next(error);
    }
  },

  updateVocab: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateVocabSchema.parse(req.body);
      const audioFile = req.files && !Array.isArray(req.files) ? req.files['audio']?.[0] : undefined;
      const vocab = await vocabService.updateVocab(req.params.id as string, req.user!.id, data, audioFile);
      res.status(StatusCodes.OK).json({ data: vocab });
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
      res.status(StatusCodes.OK).json({ data: stats });
    } catch (error) {
      next(error);
    }
  },

  importCsv: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ApiError('Vui lòng upload file CSV', StatusCodes.BAD_REQUEST);
      }
      const result = await vocabImportService.importCsv(req.user!.id, req.file.buffer);
      res.status(StatusCodes.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  exportCsv: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const csvString = await vocabImportService.exportCsv(req.user!.id);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=vocabulary.csv');
      res.status(StatusCodes.OK).send(csvString);
    } catch (error) {
      next(error);
    }
  },

  getDashboardStatsSrs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await vocabSrsService.getDashboardStats(req.user!.id);
      res.status(StatusCodes.OK).json({ data: stats });
    } catch (error) {
      next(error);
    }
  },

  getStudySessionSrs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { topic, limit } = req.query;
      if (!topic || typeof topic !== 'string') {
        throw new ApiError('Topic is required', StatusCodes.BAD_REQUEST);
      }

      const parsedLimit = limit ? parseInt(limit as string) : 20;
      const sessionCards = await vocabSrsService.getStudySession(req.user!.id, topic as string, parsedLimit);

      res.status(StatusCodes.OK).json({ data: sessionCards });
    } catch (error) {
      next(error);
    }
  },

  submitReviewSrs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { vocabId } = req.params;
      const { rating } = req.body;

      if (!rating || ![1, 2, 3, 4].includes(rating)) {
        throw new ApiError('Rating must be 1, 2, 3, or 4', StatusCodes.BAD_REQUEST);
      }

      const updatedSchedule = await vocabSrsService.submitReview(req.user!.id, vocabId as string, rating);
      const scheduleData = updatedSchedule[0];
      
      // Tính toán previewIntervals mới để trả về cho Frontend hiển thị lần lặp lại
      const preview = previewNextIntervals({
        status: scheduleData.status as any,
        repetitions: scheduleData.repetitions,
        interval: scheduleData.interval,
        ef: scheduleData.ef
      });

      res.status(StatusCodes.OK).json({ 
        data: {
          ...scheduleData,
          previewIntervals: preview
        } 
      });
    } catch (error) {
      next(error);
    }
  },

  getVocabTopics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const topics = await vocabService.getTopics(req.user!.id);
      res.status(StatusCodes.OK).json({ data: topics });
    } catch (error) {
      next(error);
    }
  }
};
