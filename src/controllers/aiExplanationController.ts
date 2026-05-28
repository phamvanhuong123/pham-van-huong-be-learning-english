import { Request, Response } from "express";
import { aiExplanationService } from "@/services/aiExplanationService";
import { StatusCodes } from "http-status-codes";

const explainQuestion = async (req: Request, res: Response) => {
  try {
    const { questionId, questionText, options, correctLabel, part, passageContent, forceRefresh } = req.body;

    if (!questionId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Thiếu questionId"
      });
    }

    const result = await aiExplanationService.explainQuestion({
      questionId,
      questionText,
      options: options || [],
      correctLabel,
      part,
      passageContent,
      forceRefresh
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Lỗi server"
    });
  }
};

export const aiExplanationController = {
  explainQuestion
};
