import { prisma } from "@/config/prisma";
import { deleteMediaByUrl } from "@/config/cloudinary";
import {
  CreateStandaloneQuestionBody,
  CreateQuestionGroupBody,
  UpdateQuestionBody,
  UpdatePassageGroupBody,
} from "@/types/question.types";
import {
  QUESTION_SELECT_FIELDS,
  PASSAGE_GROUP_SELECT_FIELDS,
  PASSAGE_SELECT_FIELDS,
} from "@/utils/contanst";
import { getActiveExam } from "@/utils/examHelper";
import { validatePartMedia, validateQuestionText, validateQuestionOrder } from "@/utils/toeicRules";
import ApiError from "@/utils/ApiError";
import { StatusCodes } from "http-status-codes";

const checkOrderConflict = async (examId: string, orders: number[], excludeId?: string) => {
  const conflictQuestions = await prisma.question.findMany({
    where: {
      examId,
      isDeleted: false,
      order: { in: orders },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { order: true },
  });

  if (conflictQuestions.length > 0) {
    const conflictOrders = conflictQuestions.map((q) => q.order).join(", ");
    throw new ApiError(
      `Order ${conflictOrders} đã tồn tại trong đề thi này`,
      StatusCodes.CONFLICT
    );
  }
};

const createStandaloneQuestion = async (data: CreateStandaloneQuestionBody) => {
  const exam = await getActiveExam(data.examId);

  // Chỉ cho phép Part 5
  if (exam.part !== "PART5") {
    throw new ApiError(
      `Câu hỏi đơn chỉ dành cho Part 5. Đề thi này thuộc ${exam.part}`,
      StatusCodes.BAD_REQUEST
    );
  }

  // Validate order bounds
  validateQuestionOrder(exam.part, data.order, 0);

  // Kiểm tra order không trùng
  await checkOrderConflict(data.examId, [data.order]);

  return await prisma.$transaction(async (tx) => {
    const question = await tx.question.create({
      data: {
        examId: data.examId,
        grammarTopicId: data.grammarTopicId,
        questionText: data.questionText,
        difficulty: data.difficulty ?? "MEDIUM",
        explanation: data.explanation,
        order: data.order,
        options: {
          create: data.options.map((opt) => ({
            label: opt.label,
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        },
      },
      select: QUESTION_SELECT_FIELDS,
    });

    return question;
  });
};

const createQuestionGroup = async (data: CreateQuestionGroupBody) => {
  const exam = await getActiveExam(data.examId);

  // Validate media rule theo Part
  validatePartMedia(exam.part, data.passages);

  // Validate questionText và order theo Part
  data.questions.forEach((q, i) => {
    validateQuestionText(exam.part, q.questionText, i);
    validateQuestionOrder(exam.part, q.order, i);
  });

  // Kiểm tra order không trùng với nhau trong request
  const orders = data.questions.map((q) => q.order);
  await checkOrderConflict(data.examId, orders);

  return await prisma.$transaction(async (tx) => {
    // Tạo PassageGroup
    const group = await tx.passageGroup.create({
      data: {
        examId: data.examId,
        type: data.passageType ?? "SINGLE",
        passages: {
          create: data.passages.map((p) => ({
            content: p.content,
            transcript: p.transcript,
            mediaUrl: p.mediaUrl,
            mediaType: p.mediaType,
            order: p.order,
          })),
        },
        questions: {
          create: data.questions.map((q) => ({
            examId: data.examId,
            questionText: q.questionText ?? null,
            difficulty: q.difficulty ?? "MEDIUM",
            explanation: q.explanation,
            order: q.order,
            options: {
              create: q.options.map((opt) => ({
                label: opt.label,
                text: opt.text,
                isCorrect: opt.isCorrect,
              })),
            },
          })),
        },
      },
      select: PASSAGE_GROUP_SELECT_FIELDS,
    });

    return group;
  });
};


const getQuestionsByExam = async (examId: string) => {
  const exam = await getActiveExam(examId);

  // Câu hỏi đơn (Part 5 – không thuộc nhóm)
  const standaloneQuestions = await prisma.question.findMany({
    where: { examId, passageGroupId: null, isDeleted: false },
    select: QUESTION_SELECT_FIELDS,
    orderBy: { order: "asc" },
  });

  // Nhóm câu hỏi (Part 1, 2, 3, 4, 6, 7)
  const questionGroups = await prisma.passageGroup.findMany({
    where: { examId },
    select: PASSAGE_GROUP_SELECT_FIELDS,
  });

  return {
    examId: exam.id,
    part: exam.part,
    standaloneQuestions,
    questionGroups,
  };
};

const getQuestions = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  examId?: string;
  part?: string;
  difficulty?: string;
}) => {
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 10);
  const skip = (page - 1) * limit;

  const where: any = {
    isDeleted: false,
  };

  if (params.search) {
    where.questionText = {
      contains: params.search,
      mode: "insensitive",
    };
  }

  if (params.examId && params.examId !== "ALL") {
    where.examId = params.examId;
  }

  if (params.difficulty && params.difficulty !== "ALL") {
    where.difficulty = params.difficulty;
  }

  if (params.part && params.part !== "ALL") {
    where.exam = {
      part: params.part as any,
    };
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip,
      take: limit,
      orderBy: { order: "asc" },
      include: {
        options: {
          orderBy: { label: "asc" },
        },
        exam: {
          select: {
            id: true,
            title: true,
            part: true,
          },
        },
        grammarTopic: {
          select: {
            id: true,
            name: true,
          },
        },
        passageGroup: {
          select: {
            id: true,
            passages: {
              select: PASSAGE_SELECT_FIELDS,
              orderBy: { order: "asc" },
            },
          },
        },
      },
    }),
    prisma.question.count({ where }),
  ]);

  return {
    questions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};


const getQuestionDetail = async (id: string) => {
  const question = await prisma.question.findFirst({
    where: { id, isDeleted: false },
    select: QUESTION_SELECT_FIELDS,
  });
  if (!question) throw new ApiError("Không tìm thấy câu hỏi", StatusCodes.NOT_FOUND);
  return question;
};


const getGroupDetail = async (groupId: string) => {
  const group = await prisma.passageGroup.findUnique({
    where: { id: groupId },
    select: PASSAGE_GROUP_SELECT_FIELDS,
  });
  if (!group) throw new ApiError("Không tìm thấy nhóm câu hỏi", StatusCodes.NOT_FOUND);
  return group;
};


const updateQuestion = async (id: string, data: UpdateQuestionBody) => {
  const existing = await prisma.question.findFirst({
    where: { id, isDeleted: false },
    select: { id: true, examId: true, order: true },
  });
  if (!existing) throw new ApiError("Không tìm thấy câu hỏi", StatusCodes.NOT_FOUND);

  // Validate order mới không trùng
  if (data.order !== undefined && data.order !== existing.order && existing.examId) {
    const exam = await getActiveExam(existing.examId);
    validateQuestionOrder(exam.part, data.order, 0);
    await checkOrderConflict(existing.examId, [data.order], id);
  }

  return await prisma.$transaction(async (tx) => {
    // Nếu có cập nhật options – xóa cũ và tạo mới
    if (data.options) {
      await tx.option.deleteMany({ where: { questionId: id } });
    }

    const question = await tx.question.update({
      where: { id },
      data: {
        questionText: data.questionText,
        difficulty: data.difficulty,
        explanation: data.explanation,
        order: data.order,
        ...(data.options
          ? {
            options: {
              create: data.options.map((opt) => ({
                label: opt.label,
                text: opt.text,
                isCorrect: opt.isCorrect,
              })),
            },
          }
          : {}),
      },
      select: QUESTION_SELECT_FIELDS,
    });

    return question;
  });
};

const updatePassageGroup = async (groupId: string, data: UpdatePassageGroupBody) => {
  const existing = await prisma.passageGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      examId: true,
      passages: { select: { id: true, mediaUrl: true, mediaType: true } },
    },
  });
  if (!existing) throw new ApiError("Không tìm thấy nhóm câu hỏi", StatusCodes.NOT_FOUND);

  // Validate media rule nếu có cập nhật passages
  if (data.passages && existing.examId) {
    const exam = await getActiveExam(existing.examId);
    validatePartMedia(exam.part, data.passages);
  }

  return await prisma.$transaction(async (tx) => {
    if (data.passages) {

      const newMediaUrls = new Set(data.passages.map((p) => p.mediaUrl).filter(Boolean));

      await Promise.all(
        existing.passages
          .filter((p) => p.mediaUrl && p.mediaType !== "TEXT" && !newMediaUrls.has(p.mediaUrl))
          .map((p) => deleteMediaByUrl(p.mediaUrl!, p.mediaType as "AUDIO" | "IMAGE" | "VIDEO"))
      );

      await tx.passage.deleteMany({ where: { passageGroupId: groupId } });

      await tx.passage.createMany({
        data: data.passages.map((p) => ({
          passageGroupId: groupId,
          content: p.content,
          transcript: p.transcript,
          mediaUrl: p.mediaUrl,
          mediaType: p.mediaType,
          order: p.order,
        })),
      });
    }

    const group = await tx.passageGroup.update({
      where: { id: groupId },
      data: {
        ...(data.passageType ? { type: data.passageType } : {}),
      },
      select: PASSAGE_GROUP_SELECT_FIELDS,
    });

    return group;
  });
};


const deleteQuestion = async (id: string) => {
  const question = await prisma.question.findFirst({
    where: { id, isDeleted: false },
    select: { id: true },
  });
  if (!question) throw new ApiError("Không tìm thấy câu hỏi", StatusCodes.NOT_FOUND);

  return await prisma.question.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
    select: { id: true, isDeleted: true, deletedAt: true },
  });
};

const deleteQuestionGroup = async (groupId: string) => {
  const group = await prisma.passageGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      passages: { select: { id: true, mediaUrl: true, mediaType: true } },
    },
  });
  if (!group) throw new ApiError("Không tìm thấy nhóm câu hỏi", StatusCodes.NOT_FOUND);

  // Xóa media trên Cloudinary trước
  await Promise.all(
    group.passages
      .filter((p) => p.mediaUrl && p.mediaType !== "TEXT")
      .map((p) => deleteMediaByUrl(p.mediaUrl!, p.mediaType as "AUDIO" | "IMAGE" | "VIDEO"))
  );

  // Xóa PassageGroup (cascade: Passage + Question + Option tự xóa theo schema)
  await prisma.passageGroup.delete({ where: { id: groupId } });

  return { id: groupId, deleted: true };
};

export const questionService = {
  createStandaloneQuestion,
  createQuestionGroup,
  getQuestions,
  getQuestionsByExam,
  getQuestionDetail,
  getGroupDetail,
  updateQuestion,
  updatePassageGroup,
  deleteQuestion,
  deleteQuestionGroup,
};
