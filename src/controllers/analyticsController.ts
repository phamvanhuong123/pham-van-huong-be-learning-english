import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/ApiError';
import * as analyticsService from '../services/analyticsService';

// ─── GET /api/analytics/overview ──────────────────────────────────────────────

export const getOverview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = (req as any).user.id as string;
    const data = await analyticsService.getOverview(userId);
    res.status(StatusCodes.OK).json(data);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/analytics/progress ──────────────────────────────────────────────

export const getProgress = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = (req as any).user.id as string;

    // Parse & clamp weeks — default 8, max 52, min 1
    const raw = parseInt(req.query.weeks as string, 10);
    const weeks = Number.isNaN(raw) ? 8 : raw; // clamp happens inside service

    const data = await analyticsService.getProgress(userId, weeks);
    res.status(StatusCodes.OK).json(data);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/analytics/topics ────────────────────────────────────────────────

export const getTopics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = (req as any).user as { id: string; role: string };

    // VIP guard: chỉ VIP và ADMIN được truy cập
    if (user.role !== 'VIP' && user.role !== 'ADMIN') {
      throw new ApiError('Tính năng này chỉ dành cho thành viên VIP', 403, 'VIP_REQUIRED');
    }

    const data = await analyticsService.getTopics(user.id);
    res.status(StatusCodes.OK).json(data);
  } catch (error) {
    next(error);
  }
};
