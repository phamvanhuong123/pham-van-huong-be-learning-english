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
} from '../types/admin';

/* ══════════════════════════════════════════════════════════════
   1. GET /api/admin/dashboard
══════════════════════════════════════════════════════════════ */
export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getAdminDashboard();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════════════
   2. GET /api/admin/users
══════════════════════════════════════════════════════════════ */
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, status, search, page, limit } = req.query as Record<string, string | undefined>;
    const data = await adminService.getAdminUsers({ role, status, search, page, limit });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════════════
   3. PATCH /api/admin/users/:userId
══════════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════════
   4. GET /api/admin/subscriptions
══════════════════════════════════════════════════════════════ */
export const getSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page, limit } = req.query as Record<string, string | undefined>;
    const data = await adminService.getAdminSubscriptions({ status, page, limit });
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════════════
   5. PATCH /api/admin/subscriptions/:subId
══════════════════════════════════════════════════════════════ */
export const updateSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subId = req.params.subId as string;
    const body = req.body as SubscriptionUpdateBody;

    await adminService.updateSubscription(subId, body);
    res.status(200).json({ message: 'Xử lý yêu cầu VIP thành công' });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════════════
   6. POST /api/admin/questions
══════════════════════════════════════════════════════════════ */
export const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as QuestionCreateBody;
    const question = await adminService.createQuestion(body);
    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════════════
   7. PATCH /api/admin/questions/:id
══════════════════════════════════════════════════════════════ */
export const updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const body = req.body as QuestionUpdateBody;
    const question = await adminService.updateQuestion(id, body);
    res.status(200).json(question);
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════════════
   8. DELETE /api/admin/questions/:id
══════════════════════════════════════════════════════════════ */
export const deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await adminService.deleteQuestion(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════════════
   9. POST /api/admin/exams
══════════════════════════════════════════════════════════════ */
export const createExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as ExamCreateBody;
    const exam = await adminService.createExam(body);
    res.status(201).json(exam);
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════════════
   10. PATCH /api/admin/exams/:id
══════════════════════════════════════════════════════════════ */
export const updateExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;    const body = req.body as ExamUpdateBody;
    const exam = await adminService.updateExam(id, body);
    res.status(200).json(exam);
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════════════
   11. POST /api/admin/notifications/broadcast
══════════════════════════════════════════════════════════════ */
export const broadcastNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as BroadcastBody;
    const result = await adminService.broadcastNotification(body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
