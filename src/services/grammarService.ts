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

    // Prisma relation onDelete is SetNull for questions -> grammarTopicId
    // We should delete the topic, and its questions will have grammarTopicId = null, or we can soft-delete questions
    // Since it's a grammar topic, usually we want to delete questions that belong exclusively to it. 
    // But schema says `grammarTopicId String?` and `onDelete: SetNull`. Let's just delete the topic.
    await prisma.grammarTopic.delete({
      where: { id }
    });

    return { success: true };
  }
};
