import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import ApiError from "@/utils/ApiError";

// ─── Reusable schemas ─────────────────────────────────────────────
const optionSchema = z.object({
  label: z.enum(["A", "B", "C", "D"], { error: "Label đáp án phải là A, B, C hoặc D" }),
  text: z.string({ error: "Nội dung đáp án là bắt buộc" }).min(1, "Nội dung đáp án không được để trống"),
  isCorrect: z.boolean({ error: "isCorrect phải là true hoặc false" }),
});

const passageSchema = z.object({
  content: z.string().optional(),
  mediaUrl: z.string().url("mediaUrl phải là URL hợp lệ").optional(),
  mediaType: z.enum(["TEXT", "AUDIO", "IMAGE", "VIDEO"], { error: "mediaType không hợp lệ" }),
  order: z.number({ error: "order là bắt buộc" }).int().min(0),
});

const questionPayloadSchema = z.object({
  questionText: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  explanation: z.string().optional(),
  order: z.number({ error: "order câu hỏi là bắt buộc" }).int().min(0),
  options: z.array(optionSchema).min(1, "Câu hỏi phải có ít nhất 1 đáp án"),
});

// ─── Helper parse Zod errors ──────────────────────────────────────
const parseZodError = (error: ZodError): string =>
  error.issues.map((e) => e.message).join("\n");

// ─── Helper validate options rules ────────────────────────────────
const validateOptions = (options: { label: string; isCorrect: boolean }[]): string | null => {
  // Rule 1: đúng 1 đáp án đúng
  const correctCount = options.filter((o) => o.isCorrect).length;
  if (correctCount !== 1) {
    return `Mỗi câu hỏi phải có đúng 1 đáp án đúng (hiện có ${correctCount})`;
  }

  // Rule 2: không trùng label
  const labels = options.map((o) => o.label);
  const uniqueLabels = new Set(labels);
  if (uniqueLabels.size !== labels.length) {
    return "Các đáp án không được trùng label (A, B, C, D)";
  }

  return null;
};

// ─── 1. Upload media ──────────────────────────────────────────────
// Không có body JSON – chỉ validate file thông qua uploadMiddleware

// ─── 2. Tạo câu hỏi đơn Part 5 ───────────────────────────────────
const createStandaloneQuestion = async (req: Request, res: Response, next: NextFunction) => {
  const schema = z.object({
    examId: z.string({ error: "examId là bắt buộc" }).uuid("examId phải là UUID hợp lệ"),
    grammarTopicId: z.string().uuid("grammarTopicId phải là UUID hợp lệ").optional(),
    questionText: z
      .string({ error: "Nội dung câu hỏi là bắt buộc" })
      .min(1, "Nội dung câu hỏi không được để trống"),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    explanation: z.string().optional(),
    order: z.number({ error: "order là bắt buộc" }).int().min(0),
    options: z
      .array(optionSchema)
      .min(2, "Câu hỏi Part 5 phải có ít nhất 2 đáp án")
      .max(4, "Câu hỏi không được có quá 4 đáp án"),
  });

  try {
    req.body = await schema.parseAsync(req.body);

    // Validate options rules
    const optionError = validateOptions(req.body.options);
    if (optionError) return next(new ApiError(optionError, StatusCodes.UNPROCESSABLE_ENTITY));

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new ApiError(parseZodError(error), StatusCodes.UNPROCESSABLE_ENTITY));
    }
    next(error);
  }
};

// ─── 3. Tạo nhóm câu hỏi (Part 1, 2, 3, 4, 6, 7) ────────────────
const createQuestionGroup = async (req: Request, res: Response, next: NextFunction) => {
  const schema = z.object({
    examId: z.string({ error: "examId là bắt buộc" }).uuid("examId phải là UUID hợp lệ"),
    passageType: z.enum(["SINGLE", "DOUBLE", "TRIPLE"]).default("SINGLE"),
    passages: z
      .array(passageSchema)
      .min(1, "Nhóm câu hỏi phải có ít nhất 1 passage"),
    questions: z
      .array(questionPayloadSchema)
      .min(1, "Nhóm câu hỏi phải có ít nhất 1 câu hỏi"),
  });

  try {
    req.body = await schema.parseAsync(req.body);

    // Validate options rules cho từng câu hỏi
    for (let i = 0; i < req.body.questions.length; i++) {
      const q = req.body.questions[i];
      const optionError = validateOptions(q.options);
      if (optionError) {
        return next(
          new ApiError(`Câu hỏi #${i + 1}: ${optionError}`, StatusCodes.UNPROCESSABLE_ENTITY)
        );
      }
    }

    // Validate order không trùng trong danh sách questions
    const orders = req.body.questions.map((q: { order: number }) => q.order);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      return next(
        new ApiError("Các câu hỏi trong nhóm không được có order trùng nhau", StatusCodes.UNPROCESSABLE_ENTITY)
      );
    }

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new ApiError(parseZodError(error), StatusCodes.UNPROCESSABLE_ENTITY));
    }
    next(error);
  }
};

// ─── 4. Cập nhật câu hỏi ─────────────────────────────────────────
const updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
  const schema = z.object({
    questionText: z.string().nullable().optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    explanation: z.string().optional(),
    order: z.number().int().min(0).optional(),
    options: z
      .array(optionSchema)
      .min(2, "Phải có ít nhất 2 đáp án")
      .max(4, "Không được có quá 4 đáp án")
      .optional(),
  });

  try {
    req.body = await schema.parseAsync(req.body);

    if (req.body.options) {
      const optionError = validateOptions(req.body.options);
      if (optionError) return next(new ApiError(optionError, StatusCodes.UNPROCESSABLE_ENTITY));
    }

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new ApiError(parseZodError(error), StatusCodes.UNPROCESSABLE_ENTITY));
    }
    next(error);
  }
};

// ─── 5. Cập nhật passage group ────────────────────────────────────
const updatePassageGroup = async (req: Request, res: Response, next: NextFunction) => {
  const schema = z.object({
    passageType: z.enum(["SINGLE", "DOUBLE", "TRIPLE"]).optional(),
    passages: z.array(passageSchema).optional(),
    questions: z.array(questionPayloadSchema).optional(),
  });

  try {
    req.body = await schema.parseAsync(req.body);

    if (req.body.questions) {
      for (let i = 0; i < req.body.questions.length; i++) {
        const q = req.body.questions[i];
        const optionError = validateOptions(q.options);
        if (optionError) {
          return next(
            new ApiError(`Câu hỏi #${i + 1}: ${optionError}`, StatusCodes.UNPROCESSABLE_ENTITY)
          );
        }
      }
    }

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new ApiError(parseZodError(error), StatusCodes.UNPROCESSABLE_ENTITY));
    }
    next(error);
  }
};

export const questionValidator = {
  createStandaloneQuestion,
  createQuestionGroup,
  updateQuestion,
  updatePassageGroup,
};
