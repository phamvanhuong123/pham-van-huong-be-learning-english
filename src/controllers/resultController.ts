import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { resultService } from "@/services/resultService";
import { reviewService } from "@/services/reviewService";

/**
 * GET /results/history
 * Lịch sử các lần thi của user
 */
const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    
    const result = await resultService.getResultHistory(userId, req.query);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Lấy lịch sử thi thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /results/:id
 * Kết quả chi tiết của 1 lần thi (Score Report)
 */
const getResultDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const resultId = req.params.id as string;
    
    const data = await resultService.getResultDetail(resultId, userId);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Lấy chi tiết kết quả thành công",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /results/:id/review
 * Lấy toàn bộ đề thi kèm đáp án và giải thích để review
 */
const getReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const resultId = req.params.id as string;
    
    const data = await reviewService.getReviewDetails(resultId, userId);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Lấy dữ liệu review thành công",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const resultController = {
  getHistory,
  getResultDetail,
  getReview
};
