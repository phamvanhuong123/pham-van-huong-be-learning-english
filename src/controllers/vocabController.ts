import { Request, Response, NextFunction } from 'express';
import * as vocabService from '../services/vocabService';
import ApiError from '../utils/ApiError';

export const addVocab = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { word, example } = req.body;

    if (!userId) {
      throw new ApiError('Bạn cần đăng nhập', 401);
    }

    if (!word || typeof word !== 'string') {
      throw new ApiError('Từ vựng không hợp lệ', 400);
    }

    const vocab = await vocabService.addVocab(userId, userRole, word, example);
    res.status(201).json(vocab);
  } catch (error) {
    next(error);
  }
};
