import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { ExamPart, ExamType, Result, ResultDetail, Question, Option } from '@prisma/client';

export interface SubmitAnswerBody {
  answers: { questionId: string; optionId: string | null }[];
  timeTaken: number;
}

const formatResultResponse = (result: Result & { details: (ResultDetail & { question: Question & { options: Option[] } })[] }) => {
  return {
    resultId: result.id,
    score: result.score,
    totalQ: result.totalQ,
    correctQ: result.correctQ,
    timeTaken: result.timeTaken,
    submittedAt: result.submittedAt,
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
  if (difficulty) where.difficulty = Number(difficulty);
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
  const exam = await prisma.exam.findUnique({
    where: { id: examId, isPublished: true },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: {
          options: true
        }
      }
    }
  });

  if (!exam) {
    throw new ApiError('Không tìm thấy bài kiểm tra', 404);
  }

  let questions = exam.questions;

  // Guard: If exam is VIP and user is STANDARD, preview only first 3 questions
  if (exam.type === ExamType.VIP && user.role === 'STANDARD') {
    questions = questions.slice(0, 3);
  }

  // Sanitize isCorrect - NEVER send isCorrect to the client
  const sanitizedQuestions = questions.map(q => ({
    id: q.id,
    order: q.order,
    passage: q.passage,
    questionText: q.questionText,
    options: q.options.map(o => ({
      id: o.id,
      label: o.label,
      text: o.text
      // isCorrect intentionally omitted
    }))
  }));

  return {
    id: exam.id,
    title: exam.title,
    part: exam.part,
    difficulty: exam.difficulty,
    duration: exam.duration,
    type: exam.type,
    questions: sanitizedQuestions
  };
};

export const submitExam = async (examId: string, userId: string, body: SubmitAnswerBody) => {
  const { answers, timeTaken } = body;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        include: { options: true }
      }
    }
  });

  if (!exam) {
    throw new ApiError('Không tìm thấy bài kiểm tra', 404);
  }

  // Idempotency: check if there's a submission within 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentResult = await prisma.result.findFirst({
    where: {
      userId,
      examId,
      submittedAt: { gte: fiveMinutesAgo }
    },
    include: {
      details: {
        include: {
          question: {
            include: { options: true }
          }
        }
      }
    }
  });

  if (recentResult) {
    return formatResultResponse(recentResult); // return old result directly
  }

  // Validate answers length
  if (answers.length !== exam.questions.length) {
    throw new ApiError('Số lượng câu trả lời không khớp với số lượng câu hỏi trong đề', 400);
  }

  let correctQ = 0;
  const totalQ = exam.questions.length;

  const resultDetailsToCreate = [];

  for (const q of exam.questions) {
    const answer = answers.find(a => a.questionId === q.id);
    if (!answer) {
      throw new ApiError(`Thiếu câu trả lời cho câu hỏi ${q.id}`, 400);
    }

    const { optionId } = answer;
    
    // Validate if optionId actually belongs to this question
    if (optionId !== null) {
      const validOption = q.options.find(o => o.id === optionId);
      if (!validOption) {
        throw new ApiError(`Lựa chọn ${optionId} không thuộc câu hỏi ${q.id}`, 400);
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

  const score = Math.round((correctQ / totalQ) * 990);

  const result = await prisma.result.create({
    data: {
      userId,
      examId,
      score,
      totalQ,
      correctQ,
      timeTaken,
      details: {
        create: resultDetailsToCreate
      }
    },
    include: {
      details: {
        include: {
          question: {
            include: { options: true }
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
      details: {
        include: {
          question: {
            include: { options: true }
          }
        }
      }
    }
  });

  if (!result) {
    throw new ApiError('Không tìm thấy kết quả', 404);
  }

  // Guard: result.userId phải === req.user.id
  if (result.userId !== userId) {
    throw new ApiError('Bạn không có quyền xem kết quả này', 403);
  }

  return formatResultResponse(result);
};
