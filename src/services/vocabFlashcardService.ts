import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { calculateSM2 } from '@/utils/sm2Algorithm';
import { differenceInMilliseconds } from 'date-fns';

export const vocabFlashcardService = {
  getTodayCards: async (userId: string, limit = 50) => {
    // Lấy danh sách từ cần ôn (nextReviewAt <= now) hoặc từ mới
    const cards = await prisma.vocab.findMany({
      where: {
        userId,
        schedule: {
          nextReviewAt: {
            lte: new Date()
          }
        }
      },
      include: {
        schedule: true
      },
      orderBy: [
        { schedule: { status: 'asc' } }, // NEW, LEARNING trước
        { schedule: { nextReviewAt: 'asc' } } // Tới hạn sớm nhất trước
      ],
      take: limit
    });
    return cards;
  },

  startSession: async (userId: string, totalCards: number) => {
    // Check if there is an active session
    let session = await prisma.vocabStudySession.findFirst({
      where: {
        userId,
        completedAt: null
      },
      orderBy: { startedAt: 'desc' }
    });

    if (!session) {
      session = await prisma.vocabStudySession.create({
        data: {
          userId,
          totalCards
        }
      });
    } else {
      // Update lastActiveAt
      session = await prisma.vocabStudySession.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() }
      });
    }

    return session;
  },

  reviewCard: async (userId: string, vocabId: string, rating: number, sessionId?: string) => {
    if (![1, 3, 4, 5].includes(rating)) {
      throw new ApiError('Rating không hợp lệ', StatusCodes.BAD_REQUEST);
    }

    const vocab = await prisma.vocab.findUnique({
      where: { id: vocabId },
      include: { schedule: true }
    });

    if (!vocab || vocab.userId !== userId || !vocab.schedule) {
      throw new ApiError('Từ vựng không tồn tại', StatusCodes.NOT_FOUND);
    }

    // Check double click (race condition prevent)
    if (vocab.schedule.lastReviewAt) {
      const msSinceLastReview = differenceInMilliseconds(new Date(), vocab.schedule.lastReviewAt);
      if (msSinceLastReview < 2000) {
        throw new ApiError('Vui lòng đợi 2 giây giữa các lần đánh giá', StatusCodes.TOO_MANY_REQUESTS);
      }
    }

    const { schedule } = vocab;
    const sm2Result = calculateSM2({
      ef: schedule.ef,
      interval: schedule.interval,
      repetitions: schedule.repetitions,
      rating
    });

    const [updatedSchedule] = await prisma.$transaction([
      prisma.vocabSchedule.update({
        where: { vocabId },
        data: {
          ef: sm2Result.ef,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          nextReviewAt: sm2Result.nextReviewAt,
          status: sm2Result.status,
          lastReviewAt: new Date()
        }
      }),
      prisma.vocabReviewLog.create({
        data: {
          vocabId,
          userId,
          rating,
          efBefore: schedule.ef,
          efAfter: sm2Result.ef,
          intervalBefore: schedule.interval,
          intervalAfter: sm2Result.interval
        }
      }),
      ...(sessionId ? [
        prisma.vocabStudySession.update({
          where: { id: sessionId },
          data: {
            completedCards: { increment: 1 },
            lastActiveAt: new Date()
          }
        })
      ] : [])
    ]);

    return updatedSchedule;
  },

  endSession: async (userId: string, sessionId: string) => {
    const session = await prisma.vocabStudySession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new ApiError('Session không tồn tại', StatusCodes.NOT_FOUND);
    }

    return await prisma.vocabStudySession.update({
      where: { id: sessionId },
      data: { completedAt: new Date() }
    });
  }
};
