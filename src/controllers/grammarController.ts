import { Request, Response, NextFunction } from 'express';
import * as grammarService from '../services/grammarService';
import { StatusCodes } from 'http-status-codes';

export const getTopics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topics = await grammarService.getGrammarTopics();
    res.status(StatusCodes.OK).json(topics);
  } catch (error) {
    next(error);
  }
};

export const getPractice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const questions = await grammarService.getQuestionsByTopic(slug, limit);
    res.status(StatusCodes.OK).json(questions);
  } catch (error) {
    next(error);
  }
};
