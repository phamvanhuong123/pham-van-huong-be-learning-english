export interface AccuracyByPart {
  PART5: number | null;
  PART6: number | null;
  PART7: number | null;
}

export interface OverviewResponse {
  totalExams: number;
  totalQuestions: number;
  totalVocab: number;
  overallAccuracy: number | null; // null khi chưa có bài nào
  accuracyByPart: AccuracyByPart;
}


export interface WeeklyProgress {
  weekStart: string;
  avgScore: number | null;
  examCount: number;
  accuracyByPart: AccuracyByPart;
}

export interface ProgressResponse {
  weekly: WeeklyProgress[];
}

export interface TopicStat {
  topic: string;
  totalQ: number;
  correctQ: number;
  accuracy: number;
}

export interface TopicsResponse {
  topics: TopicStat[];
}
