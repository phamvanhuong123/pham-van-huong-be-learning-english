import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { 
  VocabStatus, 
  Rating, 
  calculateNextReview, 
  previewNextIntervals 
} from '@/utils/srsAlgorithm';

export const vocabSrsService = {
  getDashboardStats: async (userId: string) => {
    const now = new Date();
    const stats = await prisma.$queryRaw<
      Array<{
        topic: string;
        new_count: number;
        learning_count: number;
        review_count: number;
      }>
    >`
      SELECT 
        COALESCE(v."toeicTopic", 'Uncategorized') as topic,
        CAST(SUM(CASE WHEN vs.status = 'NEW' THEN 1 ELSE 0 END) AS INTEGER) as new_count,
        CAST(SUM(CASE WHEN vs.status = 'LEARNING' AND vs."nextReviewAt" <= ${now} THEN 1 ELSE 0 END) AS INTEGER) as learning_count,
        CAST(SUM(CASE WHEN vs.status = 'REVIEW' AND vs."nextReviewAt" <= ${now} THEN 1 ELSE 0 END) AS INTEGER) as review_count
      FROM "Vocab" v
      JOIN "VocabSchedule" vs ON v.id = vs."vocabId"
      WHERE v."userId" = ${userId}
      GROUP BY COALESCE(v."toeicTopic", 'Uncategorized')
    `;

    return stats.map(stat => ({
      topic: stat.topic,
      newCount: stat.new_count,
      learningCount: stat.learning_count,
      reviewCount: stat.review_count,
    }));
  },

  getStudySession: async (userId: string, topic: string, limit: number = 20) => {
    const now = new Date();
    const topicFilter = topic === 'Uncategorized' ? null : topic;

    const learningCards = await prisma.vocab.findMany({
      where: { userId, toeicTopic: topicFilter, schedule: { status: 'LEARNING', nextReviewAt: { lte: now } } },
      include: { schedule: true },
      take: limit
    });

    let remainingLimit = limit - learningCards.length;
    let reviewCards: any[] = [];
    if (remainingLimit > 0) {
      reviewCards = await prisma.vocab.findMany({
        where: { userId, toeicTopic: topicFilter, schedule: { status: 'REVIEW', nextReviewAt: { lte: now } } },
        include: { schedule: true },
        take: remainingLimit,
        orderBy: { schedule: { nextReviewAt: 'asc' } }
      });
    }

    remainingLimit -= reviewCards.length;
    let newCards: any[] = [];
    if (remainingLimit > 0) {
      newCards = await prisma.vocab.findMany({
        where: { userId, toeicTopic: topicFilter, schedule: { status: 'NEW' } },
        include: { schedule: true },
        take: remainingLimit
      });
    }

    const sessionCards = [...learningCards, ...reviewCards, ...newCards];

    // Gắn luôn thời gian dự đoán (previewIntervals) vào thẻ từ tầng Service để Controller không phải xử lý
    return sessionCards.map(card => {
      if (!card.schedule) return card;
      const preview = previewNextIntervals({
        status: card.schedule.status as VocabStatus,
        repetitions: card.schedule.repetitions,
        interval: card.schedule.interval,
        ef: card.schedule.ef
      });
      return { ...card, previewIntervals: preview };
    });
  },

  submitReview: async (userId: string, vocabId: string, rating: number) => {
    const currentSchedule = await prisma.vocabSchedule.findFirst({
      where: { vocabId, vocab: { userId } }
    });
    if (!currentSchedule) {
      throw new ApiError('Không tìm thấy lịch học cho từ vựng này', StatusCodes.NOT_FOUND);
    }

    const nextSchedule = calculateNextReview({
      status: currentSchedule.status as VocabStatus,
      repetitions: currentSchedule.repetitions,
      interval: currentSchedule.interval,
      ef: currentSchedule.ef
    }, rating as Rating);

    return await prisma.$transaction([
      prisma.vocabSchedule.update({
        where: { vocabId },
        data: {
          status: nextSchedule.status,
          repetitions: nextSchedule.repetitions,
          interval: nextSchedule.interval,
          ef: nextSchedule.ef,
          nextReviewAt: nextSchedule.nextReviewAt,
          lastReviewAt: new Date()
        }
      }),
      prisma.vocabReviewLog.create({
        data: {
          vocabId,
          userId,
          rating,
          efBefore: currentSchedule.ef,
          efAfter: nextSchedule.ef,
          intervalBefore: currentSchedule.interval,
          intervalAfter: nextSchedule.interval
        }
      })
    ]);
  }
};
