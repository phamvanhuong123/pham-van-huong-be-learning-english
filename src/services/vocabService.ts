import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { calculateSM2, SM2Rating } from '../lib/sm2';

// ─── Constants ───────────────────────────────────────────────────────────────
const STANDARD_VOCAB_LIMIT = 50;
const STANDARD_WARN_THRESHOLD = 45;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface VocabFilter {
  status?: string;
  topic?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BulkImportItem {
  word: string;
  meaning: string;
  example?: string;
  topic?: string;
}

export interface BulkImportResult {
  imported: number;
  skipped: number;
  skippedWords: string[];
}

// ─── addVocab (existing, auto-creates schedule) ───────────────────────────────
export const addVocab = async (
  userId: string,
  userRole: string,
  word: string,
  example?: string
) => {
  const normalizedWord = word.trim().toLowerCase();

  // Check duplicate
  const existingVocab = await prisma.vocab.findFirst({
    where: { userId, word: normalizedWord },
  });
  if (existingVocab) {
    throw new ApiError('Từ này đã có trong Vocab của bạn', 409);
  }

  // Enforce STANDARD limit
  if (userRole === 'STANDARD') {
    const count = await prisma.vocab.count({ where: { userId } });
    if (count >= STANDARD_VOCAB_LIMIT) {
      throw new ApiError(
        'Đã đạt giới hạn 50 từ. Nâng cấp VIP để lưu không giới hạn!',
        403,
        'VOCAB_LIMIT_REACHED'
      );
    }
  }

  // Create vocab + auto-create VocabSchedule (NEW status, nextReviewAt = today)
  const vocab = await prisma.vocab.create({
    data: {
      userId,
      word: normalizedWord,
      meaning: 'Đang cập nhật...',
      example,
      schedule: { create: {} },
    },
    include: { schedule: true },
  });

  return vocab;
};

// ─── getVocabs ────────────────────────────────────────────────────────────────
export const getVocabs = async (userId: string, userRole: string, filter: VocabFilter) => {
  const { status, topic, search, page = 1, limit = 20 } = filter;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId };
  if (topic) where.topic = topic;
  if (search) {
    where.OR = [
      { word: { contains: search, mode: 'insensitive' } },
      { meaning: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status) {
    where.schedule = { status };
  }

  const [vocabs, total] = await Promise.all([
    prisma.vocab.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        schedule: {
          select: { status: true, nextReviewAt: true, interval: true },
        },
      },
    }),
    prisma.vocab.count({ where }),
  ]);

  // limitInfo for Standard users
  const usedCount = await prisma.vocab.count({ where: { userId } });
  const limitInfo = {
    used: usedCount,
    max: userRole === 'STANDARD' ? STANDARD_VOCAB_LIMIT : null,
    warnThreshold: userRole === 'STANDARD' ? STANDARD_WARN_THRESHOLD : null,
  };

  return { vocabs, total, limitInfo };
};

// ─── updateVocab ──────────────────────────────────────────────────────────────
export const updateVocab = async (
  userId: string,
  vocabId: string,
  data: { meaning?: string; topic?: string }
) => {
  const vocab = await prisma.vocab.findFirst({ where: { id: vocabId, userId } });
  if (!vocab) {
    throw new ApiError('Không tìm thấy từ vựng hoặc bạn không có quyền chỉnh sửa', 404);
  }

  const updated = await prisma.vocab.update({
    where: { id: vocabId },
    data: {
      ...(data.meaning !== undefined && { meaning: data.meaning }),
      ...(data.topic !== undefined && { topic: data.topic }),
    },
    include: { schedule: true },
  });

  return updated;
};

// ─── deleteVocab ──────────────────────────────────────────────────────────────
export const deleteVocab = async (userId: string, vocabId: string) => {
  const vocab = await prisma.vocab.findFirst({ where: { id: vocabId, userId } });
  if (!vocab) {
    throw new ApiError('Không tìm thấy từ vựng hoặc bạn không có quyền xóa', 404);
  }

  // Schedule is deleted via cascade in Prisma schema
  await prisma.vocab.delete({ where: { id: vocabId } });
};

// ─── bulkDeleteVocab ──────────────────────────────────────────────────────────
export const bulkDeleteVocab = async (userId: string, ids: string[]) => {
  if (!ids.length) {
    throw new ApiError('Danh sách id không được rỗng', 400);
  }

  // Verify all ids belong to user — reject entirely if any is foreign
  const ownedCount = await prisma.vocab.count({
    where: { id: { in: ids }, userId },
  });

  if (ownedCount !== ids.length) {
    throw new ApiError(
      'Một hoặc nhiều từ không thuộc về bạn hoặc không tồn tại',
      403,
      'FOREIGN_VOCAB_ID'
    );
  }

  const result = await prisma.vocab.deleteMany({
    where: { id: { in: ids }, userId },
  });

  return { deleted: result.count };
};

// ─── bulkImportVocab ──────────────────────────────────────────────────────────
export const bulkImportVocab = async (
  userId: string,
  userRole: string,
  items: BulkImportItem[]
): Promise<BulkImportResult> => {
  // Current count to respect Standard limit
  const currentCount = await prisma.vocab.count({ where: { userId } });
  const availableSlots =
    userRole === 'STANDARD' ? Math.max(0, STANDARD_VOCAB_LIMIT - currentCount) : Infinity;

  // Fetch all existing words for this user (for duplicate detection)
  const existingVocabs = await prisma.vocab.findMany({
    where: { userId },
    select: { word: true },
  });
  const existingWords = new Set(existingVocabs.map((v) => v.word.toLowerCase()));

  const toImport: BulkImportItem[] = [];
  const skippedWords: string[] = [];
  let slotsUsed = 0;

  for (const item of items) {
    const normalizedWord = item.word.trim().toLowerCase();

    // Skip if duplicate
    if (existingWords.has(normalizedWord)) {
      skippedWords.push(item.word);
      continue;
    }

    // Stop if Standard user has no more slots
    if (slotsUsed >= availableSlots) {
      skippedWords.push(item.word);
      continue;
    }

    toImport.push({ ...item, word: normalizedWord });
    existingWords.add(normalizedWord); // prevent in-batch duplicates
    slotsUsed++;
  }

  // Bulk create with nested schedule creation
  if (toImport.length > 0) {
    await Promise.all(
      toImport.map((item) =>
        prisma.vocab.create({
          data: {
            userId,
            word: item.word,
            meaning: item.meaning,
            example: item.example,
            topic: item.topic,
            schedule: { create: {} },
          },
        })
      )
    );
  }

  return {
    imported: toImport.length,
    skipped: skippedWords.length,
    skippedWords,
  };
};

// ─── getDueVocabs ─────────────────────────────────────────────────────────────
export const getDueVocabs = async (userId: string) => {
  const now = new Date();

  const dueVocabs = await prisma.vocab.findMany({
    where: {
      userId,
      schedule: {
        nextReviewAt: { lte: now },
      },
    },
    include: {
      schedule: {
        select: {
          id: true,
          status: true,
          nextReviewAt: true,
          interval: true,
          repetitions: true,
          ef: true,
        },
      },
    },
    orderBy: {
      schedule: { nextReviewAt: 'asc' },
    },
  });

  return { dueVocabs, total: dueVocabs.length };
};

// ─── reviewVocab ──────────────────────────────────────────────────────────────
export const reviewVocab = async (userId: string, vocabId: string, rating: SM2Rating) => {
  // Verify ownership
  const vocab = await prisma.vocab.findFirst({
    where: { id: vocabId, userId },
    include: { schedule: true },
  });

  if (!vocab) {
    throw new ApiError('Không tìm thấy từ vựng hoặc bạn không có quyền', 404);
  }

  if (!vocab.schedule) {
    throw new ApiError('Từ vựng chưa có lịch ôn tập', 500, 'MISSING_SCHEDULE');
  }

  const currentSchedule = vocab.schedule;

  // Calculate SM-2 next state
  const sm2Result = calculateSM2(rating, {
    ef: Number(currentSchedule.ef),
    interval: currentSchedule.interval,
    repetitions: currentSchedule.repetitions,
  });

  // Update VocabSchedule
  const updatedSchedule = await prisma.vocabSchedule.update({
    where: { id: currentSchedule.id },
    data: {
      ef: sm2Result.ef,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      status: sm2Result.status,
      nextReviewAt: sm2Result.nextReviewAt,
    },
  });

  return {
    nextReviewAt: updatedSchedule.nextReviewAt,
    interval: updatedSchedule.interval,
    status: updatedSchedule.status,
  };
};
