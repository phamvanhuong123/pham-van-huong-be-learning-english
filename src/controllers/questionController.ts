import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { questionService } from "@/services/questionService";
import {
  uploadToCloudinary,
  CloudinaryFolder,
  CloudinaryResourceType,
} from "@/config/cloudinary";
import { validateFileSize } from "@/middlewares/uploadMiddleware";
import ApiError from "@/utils/ApiError";
import { UploadMediaResponse } from "@/types/question.types";

// ─── Helper: lấy file từ req.files ────────────────────────────────
const getUploadedFile = (
  req: Request
): { file: Express.Multer.File; fieldName: "audio" | "image" | "video" } | null => {
  if (!req.files || typeof req.files !== "object") return null;
  const files = req.files as Record<string, Express.Multer.File[]>;

  for (const field of ["audio", "image", "video"] as const) {
    if (files[field]?.[0]) {
      return { file: files[field][0], fieldName: field };
    }
  }
  return null;
};

// ─── Helper: map fieldName → Cloudinary folder & resourceType ────
const getCloudinaryConfig = (
  fieldName: "audio" | "image" | "video"
): { folder: CloudinaryFolder; resourceType: CloudinaryResourceType } => {
  const map = {
    audio: { folder: "toeic/audio" as CloudinaryFolder, resourceType: "video" as CloudinaryResourceType },
    image: { folder: "toeic/images" as CloudinaryFolder, resourceType: "image" as CloudinaryResourceType },
    video: { folder: "toeic/video" as CloudinaryFolder, resourceType: "video" as CloudinaryResourceType },
  };
  return map[fieldName];
};

// ─────────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────────

/**
 * POST /question/upload
 * Upload 1 file media (audio/image/video) lên Cloudinary
 * Frontend nhận URL rồi dùng để tạo câu hỏi
 */
const uploadMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate kích thước file theo từng loại
    validateFileSize(req);

    const uploaded = getUploadedFile(req);
    if (!uploaded) {
      throw new ApiError(
        "Vui lòng upload 1 file (field: audio, image hoặc video)",
        StatusCodes.BAD_REQUEST
      );
    }

    const { file, fieldName } = uploaded;
    const { folder, resourceType } = getCloudinaryConfig(fieldName);
    const result = await uploadToCloudinary(file.buffer, folder, resourceType);

    const mediaTypeMap: Record<string, "AUDIO" | "IMAGE" | "VIDEO"> = {
      audio: "AUDIO",
      image: "IMAGE",
      video: "VIDEO",
    };

    const response: UploadMediaResponse = {
      url: result.url,
      mediaType: mediaTypeMap[fieldName],
      format: result.format,
      bytes: result.bytes,
      duration: result.duration,
    };

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Upload file thành công",
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /question/standalone
 * Tạo câu hỏi đơn Part 5
 */
const createStandaloneQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const question = await questionService.createStandaloneQuestion(req.body);
    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Tạo câu hỏi thành công",
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /question/group
 * Tạo nhóm câu hỏi Part 1, 2, 3, 4, 6, 7
 */
const createQuestionGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const group = await questionService.createQuestionGroup(req.body);
    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Tạo nhóm câu hỏi thành công",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /question
 * Lấy tất cả câu hỏi toàn hệ thống có phân trang và bộ lọc
 */
const getQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await questionService.getQuestions(req.query);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Lấy danh sách câu hỏi thành công",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /question/exam/:examId
 * Lấy tất cả câu hỏi của 1 đề thi, phân loại standalone và groups
 */
const getQuestionsByExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.examId as string;
    const data = await questionService.getQuestionsByExam(examId);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Lấy danh sách câu hỏi thành công",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /question/group/:groupId
 * Lấy chi tiết 1 nhóm câu hỏi
 */
const getGroupDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groupId = req.params.groupId as string;
    const group = await questionService.getGroupDetail(groupId);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Lấy chi tiết nhóm câu hỏi thành công",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /question/:id
 * Lấy chi tiết 1 câu hỏi
 */
const getQuestionDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const question = await questionService.getQuestionDetail(id);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Lấy chi tiết câu hỏi thành công",
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /question/:id
 * Cập nhật câu hỏi
 */
const updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const question = await questionService.updateQuestion(id, req.body);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Cập nhật câu hỏi thành công",
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /question/group/:groupId
 * Cập nhật passage group (media/text)
 */
const updatePassageGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groupId = req.params.groupId as string;
    const group = await questionService.updatePassageGroup(groupId, req.body);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Cập nhật nhóm câu hỏi thành công",
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /question/:id
 * Xóa câu hỏi (soft delete)
 */
const deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await questionService.deleteQuestion(id);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Xóa câu hỏi thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /question/group/:groupId
 * Xóa nhóm câu hỏi (hard delete + Cloudinary cleanup)
 */
const deleteQuestionGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groupId = req.params.groupId as string;
    const result = await questionService.deleteQuestionGroup(groupId);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Xóa nhóm câu hỏi thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const questionController = {
  uploadMedia,
  createStandaloneQuestion,
  createQuestionGroup,
  getQuestions,
  getQuestionsByExam,
  getGroupDetail,
  getQuestionDetail,
  updateQuestion,
  updatePassageGroup,
  deleteQuestion,
  deleteQuestionGroup,
};
