import { Request, Response, NextFunction } from 'express';
import { vocabFlashcardService } from '@/services/vocabFlashcardService';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().int().refine(val => [1, 3, 4, 5].includes(val), 'Rating không hợp lệ (1,3,4,5)'),
  sessionId: z.string().uuid().optional()
});

const startSessionSchema = z.object({
  totalCards: z.number().int().min(1)
});

export const vocabFlashcardController = {
  getTodayCards: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const cards = await vocabFlashcardService.getTodayCards(req.user!.id, limit);
      res.status(StatusCodes.OK).json({ data: cards });
    } catch (error) {
      next(error);
    }
  },

  startSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { totalCards } = startSessionSchema.parse(req.body);
      const session = await vocabFlashcardService.startSession(req.user!.id, totalCards);
      res.status(StatusCodes.OK).json(session);
    } catch (error) {
      next(error);
    }
  },

  reviewCard: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rating, sessionId } = reviewSchema.parse(req.body);
      const schedule = await vocabFlashcardService.reviewCard(req.user!.id, req.params.vocabId as string, rating, sessionId);
      res.status(StatusCodes.OK).json(schedule);
    } catch (error) {
      next(error);
    }
  },

  endSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await vocabFlashcardService.endSession(req.user!.id, req.params.sessionId as string);
      res.status(StatusCodes.OK).json(session);
    } catch (error) {
      next(error);
    }
  }
};
