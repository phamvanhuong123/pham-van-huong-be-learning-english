import { StatusCodes } from 'http-status-codes';
import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { ExamPart, ExamType, Result, ResultDetail, Question, Option, Prisma } from '@prisma/client';

export interface SubmitAnswerBody {
  answers: { questionId: string; optionId: string | null }[];
  timeTaken: number;
}

const formatResultResponse = (result: Result & { exam?: any, details: (ResultDetail & { question: Question & { options: Option[] } })[] }) => {
  return {
    resultId: result.id,
    score: result.score,
    totalQ: result.totalQ,
    correctQ: result.correctQ,
    timeTaken: result.timeTaken,
    submittedAt: result.submittedAt,
    exam: result.exam ? {
      id: result.exam.id,
      title: result.exam.title,
      part: result.exam.part
    } : undefined,
    details: result.details.map((d) => {
      const correctOption = d.question.options.find((o) => o.isCorrect);
      return {
        questionId: d.questionId,
        selectedOptionId: d.selectedOptionId,
        correctOptionId: correctOption?.id,
        isCorrect: d.isCorrect,
        explanation: d.question.explanation,
        grammarTopic: d.question.grammarTopic,
        question: {
          passageGroupId: (d.question as any).passageGroupId,
          passageGroup: (d.question as any).passageGroup,
          questionText: d.question.questionText,
          options: d.question.options.map((o) => ({
            id: o.id,
            label: o.label,
            text: o.text,
            isCorrect: o.isCorrect
          }))
        }
      };
    })
  };
};

export interface ExamQuery {
  part?: ExamPart;
  difficulty?: string;
  type?: ExamType;
  page?: string;
  limit?: string;
}

export const getExams = async (query: ExamQuery, userId?: string) => {
  const { part, difficulty, type, page = '1', limit = '12' } = query;
  
  const where: Record<string, unknown> = { isPublished: true };
  if (part) where.part = part;
  if (difficulty) where.difficulty = difficulty;
  if (type) where.type = type;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [exams, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        title: true,
        part: true,
        difficulty: true,
        type: true,
        duration: true,
        _count: {
          select: { questions: true }
        }
      }
    }),
    prisma.exam.count({ where })
  ]);

  let userScores: Record<string, number> = {};
  if (userId && exams.length > 0) {
    const bestResults = await prisma.result.groupBy({
      by: ['examId'],
      where: { userId, examId: { in: exams.map(e => e.id) } },
      _max: { score: true }
    });
    bestResults.forEach(r => {
      if (r._max.score !== null) {
        userScores[r.examId] = r._max.score;
      }
    });
  }

  return {
    exams: exams.map(e => ({
      id: e.id,
      title: e.title,
      part: e.part,
      difficulty: e.difficulty,
      type: e.type,
      duration: e.duration,
      totalQuestions: e._count.questions,
      userBestScore: userScores[e.id] ?? undefined
    })),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit)
    }
  };
};

export const getExamById = async (examId: string, user: { role: string }) => {
  const examInclude = Prisma.validator<Prisma.ExamInclude>()({
    questions: {
      orderBy: { order: 'asc' },
      include: {
        options: true,
        passageGroup: {
          include: { passages: true },
        },
      },
    },
    childExams: {
      where: { isPublished: true },
      orderBy: { part: 'asc' },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: true,
            passageGroup: {
              include: { passages: true },
            },
          },
        },
      },
    },
  });

  const exam = await prisma.exam.findUnique({
    where: { id: examId, isPublished: true },
    include: examInclude,
  });

  type ExamWithDetails = Prisma.ExamGetPayload<{ include: typeof examInclude }>;

  if (!exam) {
    throw new ApiError('Không tìm thấy bài kiểm tra', StatusCodes.NOT_FOUND);
  }

  const examData = exam as ExamWithDetails;

  // Nếu FULL thì gộp câu hỏi từ các đề con theo thứ tự Part
  let rawQuestions = examData.questions;
  if (examData.part === 'FULL' && examData.childExams.length > 0) {
    const partOrder: Record<string, number> = { PART5: 1, PART6: 2, PART7: 3 };
    const sortedChildren = [...examData.childExams].sort(
      (a, b) => (partOrder[a.part] ?? 99) - (partOrder[b.part] ?? 99),
    );
    rawQuestions = sortedChildren.flatMap((child) => child.questions);
  }

  let questions = rawQuestions;
  if (exam.type === ExamType.VIP && user.role === 'STANDARD') {
    questions = questions.slice(0, 3);
  }

  // Sanitize isCorrect — KHÔNG gửi isCorrect cho client
  const sanitizedQuestions = questions.map((q: any) => ({
    id: q.id,
    order: q.order,
    passageGroupId: q.passageGroupId,
    passageGroup: q.passageGroup,
    questionText: q.questionText,
    options: q.options.map((o: any) => ({
      id: o.id,
      label: o.label,
      text: o.text,
      // isCorrect intentionally omitted
    })),
  }));

  return {
    id: exam.id,
    title: exam.title,
    part: exam.part,
    difficulty: exam.difficulty,
    duration: exam.duration,
    type: exam.type,
    questions: sanitizedQuestions,
  };
};


export const submitExam = async (examId: string, userId: string, body: SubmitAnswerBody) => {
  const { answers, timeTaken } = body;
  const examInclude = Prisma.validator<Prisma.ExamInclude>()({
    questions: {
      include: { options: true },
    },
    childExams: {
      include: {
        questions: {
          include: { options: true },
        },
      },
    },
  });

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: examInclude,
  });

  type ExamWithDetails = Prisma.ExamGetPayload<{ include: typeof examInclude }>;

  if (!exam) {
    throw new ApiError('Không tìm thấy bài kiểm tra', StatusCodes.NOT_FOUND);
  }

  const examData = exam as ExamWithDetails;

  // Nếu FULL thì gộp câu hỏi từ các đề con
  let allQuestions = examData.questions;
  if (examData.part === 'FULL' && examData.childExams.length > 0) {
    const partOrder: Record<string, number> = { PART5: 1, PART6: 2, PART7: 3 };
    const sortedChildren = [...examData.childExams].sort(
      (a, b) => (partOrder[a.part] ?? 99) - (partOrder[b.part] ?? 99),
    );
    allQuestions = sortedChildren.flatMap((child) => child.questions);
  }

  const resultDetailsToCreate = [];
  let correctQ = 0;
  const totalQ = allQuestions.length;

  if (totalQ === 0) {
    throw new ApiError('Bài thi không có câu hỏi nào để chấm điểm', StatusCodes.BAD_REQUEST);
  }

  for (const q of allQuestions) {
    const answer = answers.find(a => a.questionId === q.id);
    const optionId = answer?.optionId ?? null;
    
    // Validate if optionId actually belongs to this question
    if (optionId !== null) {
      const validOption = q.options.find(o => o.id === optionId);
      if (!validOption) {
        throw new ApiError(`Lựa chọn ${optionId} không thuộc câu hỏi ${q.id}`, StatusCodes.BAD_REQUEST);
      }
    }

    const correctOption = q.options.find(o => o.isCorrect);
    const isCorrect = optionId !== null && optionId === correctOption?.id;

    if (isCorrect) {
      correctQ++;
    }

    resultDetailsToCreate.push({
      questionId: q.id,
      selectedOptionId: optionId,
      isCorrect
    });
  }

  
  let score = 0;
  if (['PART5', 'PART6', 'PART7'].includes(exam.part)) {
    score = correctQ * 5;
  } else {

    score = Math.round((correctQ / totalQ) * 990);
  }

  const result = await prisma.result.create({
    data: {
      user: { connect: { id: userId } },
      exam: { connect: { id: examId } },
      score,
      totalQ,
      correctQ,
      timeTaken,
      details: {
        create: resultDetailsToCreate
      }
    },
    include: {
      exam: true,
      details: {
        include: {
          question: {
            include: { 
              options: true,
              passageGroup: {
                include: { passages: true }
              }
            }
          }
        }
      }
    }
  });

  return formatResultResponse(result);
};

export const getResultById = async (resultId: string, userId: string) => {
  const result = await prisma.result.findUnique({
    where: { id: resultId },
    include: {
      exam: true,
      details: {
        include: {
          question: {
            include: { 
              options: true,
              passageGroup: {
                include: { passages: true }
              }
            }
          }
        }
      }
    }
  });

  if (!result) {
    throw new ApiError('Không tìm thấy kết quả', StatusCodes.NOT_FOUND);
  }
  if (result.userId !== userId) {
    throw new ApiError('Bạn không có quyền xem kết quả này', StatusCodes.FORBIDDEN);
  }

  return formatResultResponse(result);
};

export interface ResultQuery {
  part?: ExamPart | 'ALL';
  page?: string;
  limit?: string;
}

export const getResults = async (query: ResultQuery, userId: string) => {
  const { part, page = '1', limit = '10' } = query;
  
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: Record<string, unknown> = { userId };
  if (part && part !== 'ALL') {
    where.exam = { part };
  }

  const [results, total] = await Promise.all([
    prisma.result.findMany({
      where,
      skip,
      take,
      orderBy: { submittedAt: 'desc' },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            part: true,
            difficulty: true
          }
        }
      }
    }),
    prisma.result.count({ where })
  ]);

  return {
    results: results.map(r => ({
      id: r.id,
      examId: r.examId,
      examTitle: r.exam.title,
      part: r.exam.part,
      difficulty: r.exam.difficulty,
      score: r.score,
      correctQ: r.correctQ,
      totalQ: r.totalQ,
      timeTaken: r.timeTaken,
      submittedAt: r.submittedAt
    })),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};
