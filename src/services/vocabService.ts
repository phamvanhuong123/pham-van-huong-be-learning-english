import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

export const vocabService = {
  getVocabList: async (userId: string, query: any) => {
    const { search, toeicTopic, status, page = 1, limit = 10 } = query;
    const whereClause: any = { userId };

    if (toeicTopic) whereClause.toeicTopic = toeicTopic;
    if (search) whereClause.word = { contains: search, mode: 'insensitive' };
    if (status) {
      whereClause.schedule = { status };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [vocabs, total] = await prisma.$transaction([
      prisma.vocab.findMany({
        where: whereClause,
        include: { schedule: true },
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

  getVocabById: async (vocabId: string, userId: string) => {
    const vocab = await prisma.vocab.findUnique({
      where: { id: vocabId },
      include: { schedule: true }
    });

    if (!vocab || vocab.userId !== userId) {
      throw new ApiError('Từ vựng không tồn tại hoặc không có quyền truy cập', StatusCodes.NOT_FOUND);
    }
    return vocab;
  },

  createVocab: async (userId: string, data: any, audioFile?: Express.Multer.File) => {

    const existing = await prisma.vocab.findUnique({
      where: {
        userId_word: { userId, word: data.word }
      }
    });
    if (existing) {
      throw new ApiError(`Từ "${data.word}" đã tồn tại trong thư viện của bạn`, StatusCodes.CONFLICT);
    }

    let finalAudioUrl = data.audioUrl;

    if (audioFile) {
      const { uploadToCloudinary } = await import('@/config/cloudinary');
      const uploadResult = await uploadToCloudinary(audioFile.buffer, 'toeic/audio', 'video');
      finalAudioUrl = uploadResult.url;
    } else if (!finalAudioUrl) {
      // Auto TTS if no URL provided
      finalAudioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(data.word)}`;
    }

    // Create vocab and schedule in transaction
    const vocab = await prisma.vocab.create({
      data: {
        ...data,
        audioUrl: finalAudioUrl,
        userId,
        schedule: {
          create: {}
        }
      },
      include: { schedule: true }
    });

    return vocab;
  },

  updateVocab: async (vocabId: string, userId: string, data: any, audioFile?: Express.Multer.File) => {
    const vocab = await prisma.vocab.findUnique({ where: { id: vocabId } });
    if (!vocab || vocab.userId !== userId) {
      throw new ApiError('Từ vựng không tồn tại hoặc không có quyền truy cập', StatusCodes.NOT_FOUND);
    }

    if (data.word && data.word !== vocab.word) {
      const existing = await prisma.vocab.findUnique({
        where: {
          userId_word: { userId, word: data.word }
        }
      });
      if (existing) {
        throw new ApiError(`Từ "${data.word}" đã tồn tại trong thư viện của bạn`, StatusCodes.CONFLICT);
      }
    }

    let finalAudioUrl = data.audioUrl !== undefined ? data.audioUrl : vocab.audioUrl;

    if (audioFile) {
      const { uploadToCloudinary } = await import('@/config/cloudinary');
      const uploadResult = await uploadToCloudinary(audioFile.buffer, 'toeic/audio', 'video');
      finalAudioUrl = uploadResult.url;
    } else if (data.audioUrl === '' && data.word) {
      // If user explicitly cleared the audio URL, regenerate TTS based on the new or old word
      const wordToSpeak = data.word || vocab.word;
      finalAudioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(wordToSpeak)}`;
    }

    return await prisma.vocab.update({
      where: { id: vocabId },
      data: {
        ...data,
        audioUrl: finalAudioUrl
      },
      include: { schedule: true }
    });
  },

  deleteVocab: async (vocabId: string, userId: string) => {
    const vocab = await prisma.vocab.findUnique({ where: { id: vocabId } });
    if (!vocab || vocab.userId !== userId) {
      throw new ApiError('Từ vựng không tồn tại hoặc không có quyền truy cập', StatusCodes.NOT_FOUND);
    }

    if (vocab.audioUrl?.includes('res.cloudinary.com')) {
      const { deleteMediaByUrl } = await import('@/config/cloudinary');
      await deleteMediaByUrl(vocab.audioUrl, 'AUDIO');
    }

    await prisma.vocab.delete({
      where: { id: vocabId }
    });
    return { success: true };
  },

  getVocabStats: async (userId: string) => {
    const stats = await prisma.vocabSchedule.groupBy({
      by: ['status'],
      where: { vocab: { userId } },
      _count: { vocabId: true }
    });

    const result = {
      NEW: 0,
      LEARNING: 0,
      REVIEW: 0,
      MASTERED: 0
    };

    stats.forEach(stat => {
      result[stat.status] = stat._count.vocabId;
    });

    return result;
  },

  getTopics: async (userId: string) => {
    const vocabs = await prisma.vocab.findMany({
      where: { userId, toeicTopic: { not: null } },
      select: { toeicTopic: true },
      distinct: ['toeicTopic'],
      orderBy: { toeicTopic: 'asc' }
    });

    return vocabs
      .map(v => v.toeicTopic)
      .filter((t): t is string => t !== null);
  },

};
