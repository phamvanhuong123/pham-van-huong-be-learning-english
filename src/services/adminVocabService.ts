import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import ApiError from '../utils/ApiError';
import { StatusCodes } from 'http-status-codes';

export interface AdminVocabFilter {
  topic?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface VocabCreateBody {
  word: string;
  meaning: string;
  phonetic?: string | null;
  audioUrl?: string | null;
  topic?: string | null;
  example?: string | null;
}

export interface VocabUpdateBody extends Partial<VocabCreateBody> {}

export const getAdminVocabs = async (filter: AdminVocabFilter) => {
  const { topic, search, page = 1, limit = 20 } = filter;
  const skip = (page - 1) * limit;

  const where: Prisma.VocabWhereInput = {
    userId: null,
  };

  if (topic) where.topic = { contains: topic, mode: 'insensitive' };
  if (search) {
    where.OR = [
      { word: { contains: search, mode: 'insensitive' } },
      { meaning: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [vocabs, total] = await Promise.all([
    prisma.vocab.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vocab.count({ where }),
  ]);

  return { vocabs, total };
};

export const createAdminVocab = async (data: VocabCreateBody) => {
  const existing = await prisma.vocab.findFirst({
    where: { word: data.word.trim().toLowerCase(), userId: null },
  });

  if (existing) {
    throw new ApiError('Từ vựng này đã tồn tại trong thư viện hệ thống', StatusCodes.CONFLICT);
  }

  return prisma.vocab.create({
    data: {
      ...data,
      word: data.word.trim().toLowerCase(),
      userId: null,
    },
  });
};

export const updateAdminVocab = async (id: string, data: VocabUpdateBody) => {
  const vocab = await prisma.vocab.findFirst({ where: { id, userId: null } });
  if (!vocab) {
    throw new ApiError('Không tìm thấy từ vựng hệ thống', StatusCodes.NOT_FOUND);
  }

  return prisma.vocab.update({
    where: { id },
    data,
  });
};

export const deleteAdminVocab = async (id: string) => {
  const vocab = await prisma.vocab.findFirst({ where: { id, userId: null } });
  if (!vocab) {
    throw new ApiError('Không tìm thấy từ vựng hệ thống', StatusCodes.NOT_FOUND);
  }

  await prisma.vocab.delete({ where: { id } });
};

export const bulkImportAdminVocab = async (items: Array<VocabCreateBody>) => {
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const item of items) {
    try {
      const word = item.word.trim().toLowerCase();
      const existing = await prisma.vocab.findFirst({
        where: { word, userId: null },
      });

      if (existing) {
        results.skipped++;
        continue;
      }

      await prisma.vocab.create({
        data: {
          ...item,
          word,
          userId: null,
        },
      });
      results.imported++;
    } catch (error: any) {
      results.errors.push(`${item.word}: ${error.message}`);
    }
  }

  return results;
};
