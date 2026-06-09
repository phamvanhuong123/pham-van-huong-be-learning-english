import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

export const grammarService = {
  getTopics: async (query: any) => {
    const { search, page = 1, limit = 10 } = query;
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [topics, total] = await prisma.$transaction([
      prisma.grammarTopic.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { questions: { where: { isDeleted: false } } }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      prisma.grammarTopic.count({ where: whereClause })
    ]);

    return {
      data: topics,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  },

  getTopicById: async (id: string) => {
    const topic = await prisma.grammarTopic.findUnique({
      where: { id },
      include: {
        _count: {
          select: { questions: { where: { isDeleted: false } } }
        }
      }
    });

    if (!topic) {
      throw new ApiError('Chủ đề ngữ pháp không tồn tại', StatusCodes.NOT_FOUND);
    }
    return topic;
  },

  createTopic: async (data: any) => {
    // Validate duplicate slug
    const existing = await prisma.grammarTopic.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ApiError('Slug này đã tồn tại, vui lòng chọn slug khác', StatusCodes.CONFLICT);
    }

    return await prisma.grammarTopic.create({
      data
    });
  },

  updateTopic: async (id: string, data: any) => {
    const topic = await prisma.grammarTopic.findUnique({ where: { id } });
    if (!topic) {
      throw new ApiError('Chủ đề ngữ pháp không tồn tại', StatusCodes.NOT_FOUND);
    }

    if (data.slug && data.slug !== topic.slug) {
      const existing = await prisma.grammarTopic.findUnique({ where: { slug: data.slug } });
      if (existing) {
        throw new ApiError('Slug này đã tồn tại, vui lòng chọn slug khác', StatusCodes.CONFLICT);
      }
    }

    return await prisma.grammarTopic.update({
      where: { id },
      data
    });
  },

  deleteTopic: async (id: string) => {
    const topic = await prisma.grammarTopic.findUnique({ where: { id } });
    if (!topic) {
      throw new ApiError('Chủ đề ngữ pháp không tồn tại', StatusCodes.NOT_FOUND);
    }


    await prisma.grammarTopic.delete({
      where: { id }
    });

    return { success: true };
  },

  getQuestionsByTopic: async (topicId: string) => {
    const topic = await prisma.grammarTopic.findUnique({ where: { id: topicId } });
    if (!topic) {
      throw new ApiError('Chủ đề ngữ pháp không tồn tại', StatusCodes.NOT_FOUND);
    }

    const questions = await prisma.question.findMany({
      where: { grammarTopicId: topicId, isDeleted: false },
      include: {
        options: { orderBy: { label: 'asc' } }
      },
      orderBy: { order: 'asc' }
    });

    return { topic, questions };
  },

  createQuestion: async (topicId: string, data: any) => {
    const topic = await prisma.grammarTopic.findUnique({ where: { id: topicId } });
    if (!topic) {
      throw new ApiError('Chủ đề ngữ pháp không tồn tại', StatusCodes.NOT_FOUND);
    }

    // Tính order tự động: max order hiện tại + 1
    const maxOrderResult = await prisma.question.aggregate({
      where: { grammarTopicId: topicId, isDeleted: false },
      _max: { order: true }
    });
    const nextOrder = (maxOrderResult._max.order ?? -1) + 1;

    return await prisma.question.create({
      data: {
        grammarTopicId: topicId,
        examId: null,
        questionText: data.questionText,
        difficulty: data.difficulty ?? 'MEDIUM',
        explanation: data.explanation ?? null,
        order: nextOrder,
        options: {
          create: data.options.map((opt: any) => ({
            label: opt.label,
            text: opt.text,
            isCorrect: opt.isCorrect,
          }))
        }
      },
      include: {
        options: { orderBy: { label: 'asc' } }
      }
    });
  },

  updateQuestion: async (questionId: string, data: any) => {
    const question = await prisma.question.findFirst({
      where: { id: questionId, isDeleted: false }
    });
    if (!question) {
      throw new ApiError('Câu hỏi không tồn tại', StatusCodes.NOT_FOUND);
    }

    return await prisma.$transaction(async (tx) => {
      // Nếu có cập nhật options – xóa cũ và tạo mới
      if (data.options) {
        await tx.option.deleteMany({ where: { questionId } });
      }

      return await tx.question.update({
        where: { id: questionId },
        data: {
          ...(data.questionText !== undefined && { questionText: data.questionText }),
          ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
          ...(data.explanation !== undefined && { explanation: data.explanation }),
          ...(data.options && {
            options: {
              create: data.options.map((opt: any) => ({
                label: opt.label,
                text: opt.text,
                isCorrect: opt.isCorrect,
              }))
            }
          }),
        },
        include: {
          options: { orderBy: { label: 'asc' } }
        }
      });
    });
  },

  deleteQuestion: async (questionId: string) => {
    const question = await prisma.question.findFirst({
      where: { id: questionId, isDeleted: false }
    });
    if (!question) {
      throw new ApiError('Câu hỏi không tồn tại', StatusCodes.NOT_FOUND);
    }

    await prisma.question.update({
      where: { id: questionId },
      data: { isDeleted: true, deletedAt: new Date() }
    });

    return { success: true };
  }
};
