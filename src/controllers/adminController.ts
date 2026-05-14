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
  GrammarTopicCreateBody,
  GrammarTopicUpdateBody,
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

export const deleteSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subId = req.params.subId as string;
    await adminService.deleteSubscription(subId);
    res.status(StatusCodes.OK).json({ message: 'Xóa yêu cầu thành công' });
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
    res.status(StatusCodes.OK).json({ message: 'Đã chuyển câu hỏi vào thùng rác' });
  } catch (error) {
    next(error);
  }
};

export const restoreQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await adminService.restoreQuestion(id);
    res.status(StatusCodes.OK).json({ message: 'Khôi phục câu hỏi thành công' });
  } catch (error) {
    next(error);
  }
};

export const hardDeleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await adminService.hardDeleteQuestion(id);
    res.status(StatusCodes.OK).json({ message: 'Đã xóa vĩnh viễn câu hỏi' });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body as { ids: string[] };
    await adminService.bulkDeleteQuestions(ids);
    res.status(StatusCodes.OK).json({ message: `Đã chuyển ${ids.length} câu hỏi vào thùng rác` });
  } catch (error) {
    next(error);
  }
};

export const bulkRestoreQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body as { ids: string[] };
    await adminService.bulkRestoreQuestions(ids);
    res.status(StatusCodes.OK).json({ message: `Đã khôi phục ${ids.length} câu hỏi` });
  } catch (error) {
    next(error);
  }
};

export const bulkHardDeleteQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body as { ids: string[] };
    await adminService.bulkHardDeleteQuestions(ids);
    res.status(StatusCodes.OK).json({ message: `Đã xóa vĩnh viễn ${ids.length} câu hỏi` });
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
    const id = req.params.id as string;
    const body = req.body as ExamUpdateBody;
    const exam = await adminService.updateExam(id, body);
    res.status(StatusCodes.OK).json(exam);
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await adminService.deleteExam(id);
    res.status(StatusCodes.OK).json({ message: 'Đã chuyển đề thi vào thùng rác' });
  } catch (error) {
    next(error);
  }
};

export const restoreExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await adminService.restoreExam(id);
    res.status(StatusCodes.OK).json({ message: 'Khôi phục đề thi thành công' });
  } catch (error) {
    next(error);
  }
};

export const hardDeleteExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await adminService.hardDeleteExam(id);
    res.status(StatusCodes.OK).json({ message: 'Đã xóa vĩnh viễn đề thi' });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteExams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body as { ids: string[] };
    await adminService.bulkDeleteExams(ids);
    res.status(StatusCodes.OK).json({ message: `Đã chuyển ${ids.length} đề thi vào thùng rác` });
  } catch (error) {
    next(error);
  }
};

export const bulkRestoreExams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body as { ids: string[] };
    await adminService.bulkRestoreExams(ids);
    res.status(StatusCodes.OK).json({ message: `Đã khôi phục ${ids.length} đề thi` });
  } catch (error) {
    next(error);
  }
};

export const bulkHardDeleteExams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body as { ids: string[] };
    await adminService.bulkHardDeleteExams(ids);
    res.status(StatusCodes.OK).json({ message: `Đã xóa vĩnh viễn ${ids.length} đề thi` });
  } catch (error) {
    next(error);
  }
};

export const getDeletedItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getDeletedItems();
    res.status(StatusCodes.OK).json(data);
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

export const getBroadcasts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getAdminBroadcasts();
    res.status(StatusCodes.OK).json(data);
  } catch (error) {
    next(error);
  }
};

export const deleteBroadcast = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await adminService.deleteAdminBroadcast(id);
    res.status(StatusCodes.OK).json({ message: 'Xóa đợt thông báo thành công' });
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

export const deletePassageGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await adminService.deletePassageGroup(id);
    res.status(StatusCodes.OK).json({ message: 'Xóa cụm nội dung thành công' });
  } catch (error) {
    next(error);
  }
};

// ─── Grammar Topic Management ────────────────────────────────────────────────

export const getGrammarTopics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topics = await adminService.getAdminGrammarTopics();
    res.status(StatusCodes.OK).json(topics);
  } catch (error) {
    next(error);
  }
};

export const createGrammarTopic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as GrammarTopicCreateBody;
    const topic = await adminService.createGrammarTopic(body);
    res.status(StatusCodes.CREATED).json(topic);
  } catch (error) {
    next(error);
  }
};

export const updateGrammarTopic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const body = req.body as GrammarTopicUpdateBody;
    const topic = await adminService.updateGrammarTopic(id, body);
    res.status(StatusCodes.OK).json(topic);
  } catch (error) {
    next(error);
  }
};

export const deleteGrammarTopic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await adminService.deleteGrammarTopic(id);
    res.status(StatusCodes.OK).json({ message: 'Xóa chủ đề thành công' });
  } catch (error) {
    next(error);
  }
};
