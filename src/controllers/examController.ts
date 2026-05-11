import { Request, Response, NextFunction } from 'express';
import * as examService from '../services/examService';
import ApiError from '../utils/ApiError';
import { StatusCodes } from 'http-status-codes';

export const getExams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id; // req.user may or may not exist depending on route protection
    const data = await examService.getExams(req.query, userId);
    res.status(StatusCodes.OK).json(data);
  } catch (error) {
    next(error);
  }
};

export const getExamById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.examId as string;
    const user = req.user; // User should be available because route is protected
    
    if (!user) {
      throw new ApiError('Bạn cần đăng nhập', StatusCodes.UNAUTHORIZED);
    }

    const data = await examService.getExamById(examId, user);
    res.status(StatusCodes.OK).json(data);
  } catch (error) {
    next(error);
  }
};

export const submitExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.examId as string;
    const userId = req.user?.id;
    const body: examService.SubmitAnswerBody = req.body;

    if (!userId) {
      throw new ApiError('Bạn cần đăng nhập', StatusCodes.UNAUTHORIZED);
    }

    if (!body.answers || !Array.isArray(body.answers)) {
      throw new ApiError('Payload không hợp lệ (thiếu answers)', StatusCodes.BAD_REQUEST);
    }

    if (typeof body.timeTaken !== 'number') {
      throw new ApiError('Payload không hợp lệ (thiếu timeTaken)', StatusCodes.BAD_REQUEST);
    }

    const data = await examService.submitExam(examId, userId, body);
    res.status(StatusCodes.CREATED).json(data);
  } catch (error) {
    next(error);
  }
};

export const getResultById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resultId = req.params.resultId as string;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError('Bạn cần đăng nhập', StatusCodes.UNAUTHORIZED);
    }

    const data = await examService.getResultById(resultId, userId);
    res.status(StatusCodes.OK).json(data);
  } catch (error) {
    next(error);
  }
};
