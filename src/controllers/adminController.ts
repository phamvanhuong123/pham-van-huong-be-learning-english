/**
 * Admin Controller — Phase 6
 * Request/Response handling cho tất cả Admin endpoints.
 * Service xử lý business logic, Controller chỉ parse req và format res.
 */

import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/adminService';
import type {
  UserUpdateBody,
  SubscriptionUpdateBody,
  QuestionCreateBody,
  QuestionUpdateBody,
  ExamCreateBody,
  ExamUpdateBody,
  BroadcastBody,
  PassageGroupCreateBody,
} from '../types/admin';
import { StatusCodes } from 'http-status-codes';

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getAdminDashboard();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};


export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, status, search, page, limit } = req.query as Record<string, string | undefined>;
    const data = await adminService.getAdminUsers({ role, status, search, page, limit });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;
    const adminId = req.user!.id as string;
    const body = req.body as UserUpdateBody;

    await adminService.updateUser(userId, adminId, body);
    res.status(200).json({ message: 'Cập nhật người dùng thành công' });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page, limit } = req.query as Record<string, string | undefined>;
    const data = await adminService.getAdminSubscriptions({ status, page, limit });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subId = req.params.subId as string;
    const body = req.body as SubscriptionUpdateBody;

    await adminService.updateSubscription(subId, body);
    res.status(StatusCodes.OK).json({ message: 'Xử lý yêu cầu VIP thành công' });
  } catch (error) {
    next(error);
  }
};

export const getQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, examId, difficulty, page, limit } = req.query as Record<string, string | undefined>;
    const data = await adminService.getAdminQuestions({ search, examId, difficulty, page, limit });
    res.status(StatusCodes.OK).json(data);
  } catch (error) {
    next(error);
  }
};

export const getExams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getAdminExams();
    res.status(StatusCodes.OK).json(data);
  } catch (error) {
    next(error);
  }
};
export const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as QuestionCreateBody;
    const question = await adminService.createQuestion(body);
    res.status(StatusCodes.CREATED).json(question);
  } catch (error) {
    next(error);
  }
};


export const updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const body = req.body as QuestionUpdateBody;
    const question = await adminService.updateQuestion(id, body);
    res.status(StatusCodes.OK).json(question);
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await adminService.deleteQuestion(id);
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

export const createExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as ExamCreateBody;
    const exam = await adminService.createExam(body);
    res.status(StatusCodes.CREATED).json(exam);
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;    const body = req.body as ExamUpdateBody;
    const exam = await adminService.updateExam(id, body);
    res.status(StatusCodes.OK).json(exam);
  } catch (error) {
    next(error);
  }
};

export const broadcastNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as BroadcastBody;
    const result = await adminService.broadcastNotification(body);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

export const getPassageGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.examId as string;
    const groups = await adminService.getPassageGroupsByExam(examId);
    res.status(StatusCodes.OK).json(groups);
  } catch (error) {
    next(error);
  }
};

export const createPassageGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as PassageGroupCreateBody;
    const group = await adminService.createPassageGroup(body);
    res.status(StatusCodes.CREATED).json(group);
  } catch (error) {
    next(error);
  }
};
export const updatePassageGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groupId = req.params.id as string;
    const group = await adminService.updatePassageGroup(groupId, req.body);
    res.status(StatusCodes.OK).json(group);
  } catch (error) {
    next(error);
  }
};
