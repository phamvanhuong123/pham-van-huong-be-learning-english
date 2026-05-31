import { prisma } from '@/config/prisma';
import ApiError from '@/utils/ApiError';
import { StatusCodes } from 'http-status-codes';

export const grammarPracticeService = {
  // Lấy danh sách chủ đề kèm theo tiến độ học của User
  getTopicsWithProgress: async (userId: string) => {
    const topics = await prisma.grammarTopic.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { questions: { where: { isDeleted: false } } }
        }
      }
    });

    // Tính toán tiến độ cho mỗi topic dựa trên các Result đã COMPLETED
    const results = await prisma.result.findMany({
      where: {
        userId,
        grammarTopicId: { not: null },
        status: 'COMPLETED'
      },
      orderBy: { submittedAt: 'desc' }
    });

    return topics.map(topic => {
      // Tìm result mới nhất cho topic này
      const latestResult = results.find(r => r.grammarTopicId === topic.id);
      return {
        ...topic,
        progress: latestResult ? {
          score: latestResult.score,
          correctQ: latestResult.correctQ,
          totalQ: latestResult.totalQ,
          xpEarned: latestResult.xpEarned,
          lastPracticed: latestResult.submittedAt
        } : null
      };
    });
  },

  // Bắt đầu phiên làm bài: Lấy danh sách câu hỏi của 1 chủ đề (ẩn đáp án đúng và giải thích)
  startPractice: async (userId: string, slug: string) => {
    const topic = await prisma.grammarTopic.findUnique({
      where: { slug }
    });

    if (!topic) {
      throw new ApiError('Chủ đề không tồn tại', StatusCodes.NOT_FOUND);
    }

    const questions = await prisma.question.findMany({
      where: {
        grammarTopicId: topic.id,
        isDeleted: false
      },
      include: {
        options: {
          select: { id: true, label: true, text: true } // KHÔNG LẤY isCorrect
        }
      },
      orderBy: { order: 'asc' }
    });

    if (questions.length === 0) {
      throw new ApiError('Chủ đề này chưa có câu hỏi nào', StatusCodes.BAD_REQUEST);
    }

    // Tạo một session (Result) với trạng thái IN_PROGRESS
    const session = await prisma.result.create({
      data: {
        userId,
        grammarTopicId: topic.id,
        status: 'IN_PROGRESS',
        totalQ: questions.length,
        startedAt: new Date(),
        isFullTest: false
      }
    });

    return { session, topic, questions };
  },

  // Nộp đáp án cho 1 câu hỏi cụ thể trong session
  submitAnswer: async (userId: string, sessionId: string, data: { questionId: string, selectedLabel: any, timeTakenSeconds: number }) => {
    const session = await prisma.result.findUnique({
      where: { id: sessionId }
    });

    if (!session || session.userId !== userId || session.status !== 'IN_PROGRESS') {
      throw new ApiError('Phiên làm bài không hợp lệ hoặc đã kết thúc', StatusCodes.BAD_REQUEST);
    }

    const question = await prisma.question.findUnique({
      where: { id: data.questionId },
      include: { options: true }
    });

    if (!question) {
      throw new ApiError('Câu hỏi không tồn tại', StatusCodes.NOT_FOUND);
    }

    const correctOption = question.options.find(o => o.isCorrect);
    const isCorrect = correctOption?.label === data.selectedLabel;

    // Lưu chi tiết
    await prisma.resultDetail.upsert({
      where: {
        resultId_questionId: {
          resultId: sessionId,
          questionId: data.questionId
        }
      },
      update: {
        selectedLabel: data.selectedLabel,
        isCorrect,
        timeTakenSeconds: data.timeTakenSeconds
      },
      create: {
        resultId: sessionId,
        questionId: data.questionId,
        selectedLabel: data.selectedLabel,
        isCorrect,
        timeTakenSeconds: data.timeTakenSeconds
      }
    });

    return {
      isCorrect,
      correctLabel: correctOption?.label,
      explanation: question.explanation
    };
  },

  // Kết thúc phiên làm bài
  endPractice: async (userId: string, sessionId: string) => {
    const session = await prisma.result.findUnique({
      where: { id: sessionId },
      include: { resultDetails: true }
    });

    if (!session || session.userId !== userId || session.status !== 'IN_PROGRESS') {
      throw new ApiError('Phiên làm bài không hợp lệ hoặc đã kết thúc', StatusCodes.BAD_REQUEST);
    }

    const correctQ = session.resultDetails.filter(d => d.isCorrect).length;
    // Tính điểm tượng trưng: mỗi câu đúng 10 điểm, ví dụ vậy
    const score = correctQ * 10;
    // XP earned = correctQ * 5
    const xpEarned = correctQ * 5;
    const timeTaken = session.resultDetails.reduce((acc, curr) => acc + (curr.timeTakenSeconds || 0), 0);

    const completedSession = await prisma.result.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        submittedAt: new Date(),
        correctQ,
        score,
        timeTaken,
        xpEarned
      }
    });

    return completedSession;
  }
};
