import prisma from '../config/database';
import { DashboardResponse, AccuracyByPart } from '../types/dashboard';

export const getDashboardData = async (userId: string): Promise<DashboardResponse> => {
  const [results, vocabCount, vocabDueToday] = await Promise.all([
    prisma.result.findMany({
      where: { userId },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            part: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.vocab.count({ where: { userId } }),
    prisma.vocabSchedule.count({
      where: {
        vocab: { userId },
        nextReviewAt: { lte: new Date() },
      },
    }),
  ]);

  const totalExamsDone = results.length;
  const averageScore =
    totalExamsDone > 0
      ? results.reduce((acc, r) => acc + r.score, 0) / totalExamsDone
      : 0;

  const accuracyByPart: AccuracyByPart = {
    PART5: calculateAccuracy(results, 'PART5'),
    PART6: calculateAccuracy(results, 'PART6'),
    PART7: calculateAccuracy(results, 'PART7'),
  };

  const recentResults = results.slice(0, 3).map((r) => ({
    id: r.id,
    score: r.score,
    totalQ: r.totalQ,
    correctQ: r.correctQ,
    submittedAt: r.submittedAt.toISOString(),
    exam: {
      id: r.exam.id,
      title: r.exam.title,
      part: r.exam.part,
    },
  }));

  return {
    stats: {
      totalExamsDone,
      averageScore: Math.round(averageScore * 10) / 10,
      accuracyByPart,
      vocabCount,
      vocabDueToday,
    },
    recentResults,
  };
};

function calculateAccuracy(results: any[], part: string): number | null {
  const partResults = results.filter((r) => r.exam.part === part);
  if (partResults.length === 0) return null;

  const totalQ = partResults.reduce((acc, r) => acc + r.totalQ, 0);
  const correctQ = partResults.reduce((acc, r) => acc + r.correctQ, 0);

  if (totalQ === 0) return null;
  return Math.round((correctQ / totalQ) * 100);
}
