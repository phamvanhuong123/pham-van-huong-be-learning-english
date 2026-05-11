import prisma from '../config/database';
import {
  AccuracyByPart,
  OverviewResponse,
  ProgressResponse,
  TopicsResponse,
  WeeklyProgress,
} from '../types/analytics';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Tính accuracy (0–100) từ tập kết quả theo part cụ thể.
 * Trả null nếu user chưa làm part đó (tổng câu = 0).
 */
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

/**
 * Trả về ISO date string của Monday đầu tuần chứa `date`.
 * (ISO week: Monday = start of week)
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // số ngày về Monday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
}

// ─── Overview ─────────────────────────────────────────────────────────────────

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

  // Tổng số câu đã làm
  const totalQuestions = results.reduce((s, r) => s + r.totalQ, 0);

  // Overall accuracy: null nếu chưa có bài nào
  const overallAccuracy: number | null =
    totalQuestions === 0
      ? null
      : Math.round(
          (results.reduce((s, r) => s + r.correctQ, 0) / totalQuestions) * 100,
        );

  // Flatten để helper dễ filter theo part
  const flat = results.map((r) => ({
    correctQ: r.correctQ,
    totalQ: r.totalQ,
    examPart: r.exam.part,
  }));

  const accuracyByPart: AccuracyByPart = {
    PART5: calcAccuracyByPart(flat, 'PART5'),
    PART6: calcAccuracyByPart(flat, 'PART6'),
    PART7: calcAccuracyByPart(flat, 'PART7'),
  };

  return { totalExams, totalQuestions, totalVocab, overallAccuracy, accuracyByPart };
};

// ─── Progress ─────────────────────────────────────────────────────────────────

export const getProgress = async (
  userId: string,
  weeks: number,
): Promise<ProgressResponse> => {
  // Clamp weeks [1, 52]
  const clampedWeeks = Math.max(1, Math.min(52, weeks));

  // Lấy kết quả trong khoảng `clampedWeeks` tuần gần nhất
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

  // Tạo map weekStart → list of results
  const weekMap = new Map<
    string,
    Array<{ score: number; totalQ: number; correctQ: number; examPart: string }>
  >();

  // Seed tất cả các tuần với array rỗng để đảm bảo mọi tuần đều có entry
  for (let i = clampedWeeks - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i * 7);
    weekMap.set(getWeekStart(d), []);
  }

  for (const r of results) {
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

    // avgScore: null nếu tuần không có bài — KHÔNG trả 0
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

  // Sort chronologically (Map insertion order đã đúng, nhưng sort lại cho chắc)
  weekly.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  return { weekly };
};

// ─── Topics ───────────────────────────────────────────────────────────────────

export const getTopics = async (userId: string): Promise<TopicsResponse> => {
  // Lấy tất cả ResultDetail của user, join sang Question để lấy grammarTopic
  // Chỉ tính câu có grammarTopic NOT NULL
  const details = await prisma.resultDetail.findMany({
    where: {
      result: { userId },
      question: { grammarTopic: { not: null } }, // bỏ qua câu không có topic
    },
    select: {
      isCorrect: true,
      question: { select: { grammarTopic: true } },
    },
  });

  // Tổng hợp theo topic
  const topicMap = new Map<string, { totalQ: number; correctQ: number }>();

  for (const d of details) {
    const topic = d.question.grammarTopic!; // đã filter not null ở trên
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

  // Sort accuracy ASC — topic yếu nhất lên đầu
  topics.sort((a, b) => a.accuracy - b.accuracy);

  return { topics };
};
