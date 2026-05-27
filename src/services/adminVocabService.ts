import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

export const adminVocabService = {
  getSystemVocabs: async (query: any) => {
    const { search, toeicTopic, page = 1, limit = 10 } = query;
    const whereClause: any = { userId: null }; // System vocabs have userId = null

    if (toeicTopic) whereClause.toeicTopic = toeicTopic;
    if (search) whereClause.word = { contains: search, mode: 'insensitive' };

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [vocabs, total] = await prisma.$transaction([
      prisma.vocab.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.vocab.count({ where: whereClause })
    ]);

    return {
      data: vocabs,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  },

  createSystemVocab: async (data: any) => {
    // Check duplicate
    const existing = await prisma.vocab.findFirst({
      where: {
        userId: null,
        word: data.word
      }
    });
    if (existing) {
      throw new ApiError(`Từ hệ thống "${data.word}" đã tồn tại`, StatusCodes.CONFLICT);
    }

    return await prisma.vocab.create({
      data: {
        ...data,
        userId: null // Set to null for system vocab
      }
    });
  },

  updateSystemVocab: async (vocabId: string, data: any) => {
    const vocab = await prisma.vocab.findUnique({ where: { id: vocabId } });
    if (!vocab || vocab.userId !== null) {
      throw new ApiError('Từ vựng hệ thống không tồn tại', StatusCodes.NOT_FOUND);
    }

    return await prisma.vocab.update({
      where: { id: vocabId },
      data
    });
  },

  deleteSystemVocab: async (vocabId: string) => {
    const vocab = await prisma.vocab.findUnique({ where: { id: vocabId } });
    if (!vocab || vocab.userId !== null) {
      throw new ApiError('Từ vựng hệ thống không tồn tại', StatusCodes.NOT_FOUND);
    }

    await prisma.vocab.delete({
      where: { id: vocabId }
    });
    return { success: true };
  }
};
