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
    const schedules = await prisma.vocabSchedule.findMany({
      where: { vocab: { userId } },
      include: { vocab: { select: { toeicTopic: true } } }
    });

    const topicStats: Record<string, { newCount: number; learningCount: number; reviewCount: number }> = {};

    schedules.forEach(vs => {
      const topic = vs.vocab.toeicTopic || 'Uncategorized';
      if (!topicStats[topic]) {
        topicStats[topic] = { newCount: 0, learningCount: 0, reviewCount: 0 };
      }

      if (vs.status === 'NEW') {
        topicStats[topic].newCount++;
      } else if (vs.status === 'LEARNING') {
        topicStats[topic].learningCount++;
      } else if (vs.status === 'REVIEW' && vs.nextReviewAt <= now) {
        topicStats[topic].reviewCount++;
      }
    });

    return Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      newCount: stats.newCount,
      learningCount: stats.learningCount,
      reviewCount: stats.reviewCount,
    }));
  },

  getStudySession: async (userId: string, topic: string, limit: number = 20) => {
    const now = new Date();
    const topicFilter = topic === 'Uncategorized' ? null : topic;

    const learningCards = await prisma.vocab.findMany({
      where: { userId, toeicTopic: topicFilter, schedule: { status: 'LEARNING' } },
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
