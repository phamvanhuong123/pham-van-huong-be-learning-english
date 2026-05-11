// ─── Shared ───────────────────────────────────────────────────────────────────

export interface AccuracyByPart {
  PART5: number | null; // null nếu chưa làm part này — không trả 0
  PART6: number | null;
  PART7: number | null;
}

// ─── GET /api/analytics/overview ──────────────────────────────────────────────

export interface OverviewResponse {
  totalExams: number;
  totalQuestions: number;
  totalVocab: number;
  overallAccuracy: number | null; // null khi chưa có bài nào
  accuracyByPart: AccuracyByPart;
}

// ─── GET /api/analytics/progress ──────────────────────────────────────────────

export interface WeeklyProgress {
  weekStart: string;            // ISO date string — start of week (Monday)
  avgScore: number | null;      // null nếu tuần không có bài thi — KHÔNG trả 0
  examCount: number;
  accuracyByPart: AccuracyByPart;
}

export interface ProgressResponse {
  weekly: WeeklyProgress[];
}

// ─── GET /api/analytics/topics ────────────────────────────────────────────────

export interface TopicStat {
  topic: string;
  totalQ: number;
  correctQ: number;
  accuracy: number; // 0–100, rounded integer
}

export interface TopicsResponse {
  topics: TopicStat[]; // sorted accuracy ASC — yếu nhất lên đầu
}
