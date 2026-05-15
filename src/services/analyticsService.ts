import prisma from '../config/database';
import {
  AccuracyByPart,
  OverviewResponse,
  ProgressResponse,
  TopicsResponse,
  WeeklyProgress,
} from '../types/analytics';
function calcAccuracyByPart(
  results: Array<{ correctQ: number; totalQ: number; examPart: string }>,
  part: 'PART5' | 'PART6' | 'PART7',
): number | null {
  const filtered = results.filter((r) => r.examPart === part);
  if (filtered.length === 0) return null;

  const totalQ = filtered.reduce((s, r) => s + r.totalQ, 0);
  const correctQ = filtered.reduce((s, r) => s + r.correctQ, 0);

  if (totalQ === 0) return null;
  return Math.round((correctQ / totalQ) * 100);
}
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay(); 
  const diff = day === 0 ? -6 : 1 - day; 
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export const getOverview = async (userId: string): Promise<OverviewResponse> => {
  const [results, totalVocab] = await Promise.all([
    prisma.result.findMany({
      where: { userId },
      select: {
        score: true,
        totalQ: true,
        correctQ: true,
        exam: { select: { part: true } },
      },
    }),
    prisma.vocab.count({ where: { userId } }),
  ]);
  const totalExams = results.length;
  const totalQuestions = results.reduce((s, r) => s + r.totalQ, 0);
  const overallAccuracy: number | null =
    totalQuestions === 0
      ? null
      : Math.round(
          (results.reduce((s, r) => s + r.correctQ, 0) / totalQuestions) * 100,
        );
  const flat = results
    .filter((r) => r.exam)
    .map((r) => ({
      correctQ: r.correctQ,
      totalQ: r.totalQ,
      examPart: r.exam!.part,
    }));

  const accuracyByPart: AccuracyByPart = {
    PART5: calcAccuracyByPart(flat, 'PART5'),
    PART6: calcAccuracyByPart(flat, 'PART6'),
    PART7: calcAccuracyByPart(flat, 'PART7'),
  };

  return { totalExams, totalQuestions, totalVocab, overallAccuracy, accuracyByPart };
};


export const getProgress = async (
  userId: string,
  weeks: number,
): Promise<ProgressResponse> => {

  const clampedWeeks = Math.max(1, Math.min(52, weeks));

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - clampedWeeks * 7);
  since.setUTCHours(0, 0, 0, 0);

  const results = await prisma.result.findMany({
    where: { userId, submittedAt: { gte: since } },
    select: {
      score: true,
      totalQ: true,
      correctQ: true,
      submittedAt: true,
      exam: { select: { part: true } },
    },
    orderBy: { submittedAt: 'asc' },
  });

  const weekMap = new Map<
    string,
    Array<{ score: number; totalQ: number; correctQ: number; examPart: string }>
  >();
  for (let i = clampedWeeks - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i * 7);
    weekMap.set(getWeekStart(d), []);
  }

  for (const r of results) {
    if (!r.exam) continue;
    const key = getWeekStart(r.submittedAt);
    const bucket = weekMap.get(key) ?? [];
    bucket.push({
      score: r.score,
      totalQ: r.totalQ,
      correctQ: r.correctQ,
      examPart: r.exam.part,
    });
    weekMap.set(key, bucket);
  }

  const weekly: WeeklyProgress[] = [];

  for (const [weekStart, bucket] of weekMap) {
    const examCount = bucket.length;

    const avgScore: number | null =
      examCount === 0
        ? null
        : Math.round(bucket.reduce((s, r) => s + r.score, 0) / examCount);

    const accuracyByPart: AccuracyByPart = {
      PART5: calcAccuracyByPart(bucket, 'PART5'),
      PART6: calcAccuracyByPart(bucket, 'PART6'),
      PART7: calcAccuracyByPart(bucket, 'PART7'),
    };

    weekly.push({ weekStart, avgScore, examCount, accuracyByPart });
  }


  weekly.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  return { weekly };
};


export const getTopics = async (userId: string): Promise<TopicsResponse> => {
  const details = await prisma.resultDetail.findMany({
    where: {
      result: { userId },
      question: { grammarTopic: { not: null } }, 
    },
    select: {
      isCorrect: true,
      question: { select: { grammarTopic: true } },
    },
  });

  const topicMap = new Map<string, { totalQ: number; correctQ: number }>();

  for (const d of details) {
    const topic = d.question.grammarTopic!;
    const current = topicMap.get(topic) ?? { totalQ: 0, correctQ: 0 };
    current.totalQ += 1;
    if (d.isCorrect) current.correctQ += 1;
    topicMap.set(topic, current);
  }

  const topics = Array.from(topicMap.entries()).map(([topic, stat]) => ({
    topic,
    totalQ: stat.totalQ,
    correctQ: stat.correctQ,
    accuracy: Math.round((stat.correctQ / stat.totalQ) * 100),
  }));

  topics.sort((a, b) => a.accuracy - b.accuracy);

  return { topics };
};
