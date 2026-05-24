import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { clientExamService } from "@/services/clientExamService";
import ApiError from "@/utils/ApiError";

export const clientExamController = {
  getPublishedExams: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query;
      const data = await clientExamService.getPublishedExams(query);
      res.status(StatusCodes.OK).json({ data });
    } catch (error) {
      next(error);
    }
  },

  getExamDetailsForClient: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };
      const data = await clientExamService.getExamDetailsForClient(id);

      if (!data) {
        throw new ApiError("Không tìm thấy đề thi", StatusCodes.NOT_FOUND);
      }

      res.status(StatusCodes.OK).json({ data });
    } catch (error) {
      next(error);
    }
  },

  startExam: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };
      // Giả sử có auth middleware set req.user, tạm mock userId nếu chưa có
      const userId = (req as any).user?.id || "86ee1cbf-2882-4f3f-aa6c-3229652e56b1";

      const result = await clientExamService.startExam(id, userId);
      res.status(StatusCodes.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  autoSaveExam: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };
      const userId = (req as any).user?.id || "86ee1cbf-2882-4f3f-aa6c-3229652e56b1";
      const { resultId, answers, timeTaken, tabSwitchCount } = req.body;

      if (!resultId || !answers) {
        throw new ApiError("Thiếu dữ liệu autosave", StatusCodes.BAD_REQUEST);
      }

      await clientExamService.autoSaveExam(id, resultId, userId, answers, timeTaken || 0, tabSwitchCount || 0);
      res.status(StatusCodes.OK).json({ message: "Autosave success" });
    } catch (error) {
      next(error);
    }
  },

  submitExam: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as { id: string };
      const userId = (req as any).user?.id || "86ee1cbf-2882-4f3f-aa6c-3229652e56b1";
      const { resultId, answers, timeTaken, tabSwitchCount } = req.body;

      if (!resultId || !answers) {
        throw new ApiError("Thiếu dữ liệu submit", StatusCodes.BAD_REQUEST);
      }

      const result = await clientExamService.submitExam(id, resultId, userId, answers, timeTaken || 0, tabSwitchCount || 0);
      res.status(StatusCodes.OK).json({ data: result, message: "Nộp bài thành công" });
    } catch (error) {
      next(error);
    }
  }
};
