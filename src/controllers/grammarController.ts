import { Request, Response, NextFunction } from 'express';
import { grammarService } from '@/services/grammarService';
import { grammarPracticeService } from '@/services/grammarPracticeService';
import { StatusCodes } from 'http-status-codes';
import { createGrammarTopicSchema, updateGrammarTopicSchema, queryGrammarTopicSchema, submitAnswerSchema } from '@/validators/grammarValidator';

export const grammarController = {
  // ─── ADMIN ENDPOINTS ──────────────────────────────────────────────
  getAdminTopics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = queryGrammarTopicSchema.parse(req.query);
      const result = await grammarService.getTopics(query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  },

  getAdminTopicById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const topic = await grammarService.getTopicById(req.params.id as string);
      res.status(StatusCodes.OK).json({ data: topic });
    } catch (error) {
      next(error);
    }
  },

  createTopic: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createGrammarTopicSchema.parse(req.body);
      const topic = await grammarService.createTopic(data);
      res.status(StatusCodes.CREATED).json({ data: topic });
    } catch (error) {
      next(error);
    }
  },

  updateTopic: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateGrammarTopicSchema.parse(req.body);
      const topic = await grammarService.updateTopic(req.params.id as string, data);
      res.status(StatusCodes.OK).json({ data: topic });
    } catch (error) {
      next(error);
    }
  },

  deleteTopic: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await grammarService.deleteTopic(req.params.id as string);
      res.status(StatusCodes.OK).json({ message: 'Xóa chủ đề thành công' });
    } catch (error) {
      next(error);
    }
  },

  // ─── CLIENT (PRACTICE) ENDPOINTS ──────────────────────────────────
  getClientTopics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const topics = await grammarPracticeService.getTopicsWithProgress(req.user!.id);
      res.status(StatusCodes.OK).json({ data: topics });
    } catch (error) {
      next(error);
    }
  },

  startPracticeSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await grammarPracticeService.startPractice(req.user!.id, req.params.slug as string);
      res.status(StatusCodes.CREATED).json({ data });
    } catch (error) {
      next(error);
    }
  },

  submitAnswer: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = submitAnswerSchema.parse(req.body);
      const result = await grammarPracticeService.submitAnswer(req.user!.id, req.params.sessionId as string, data);
      res.status(StatusCodes.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  endPracticeSession: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await grammarPracticeService.endPractice(req.user!.id, req.params.sessionId as string);
      res.status(StatusCodes.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
};
