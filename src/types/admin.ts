/**
 * Admin Panel — Type Definitions
 * Phase 6: Admin API
 */

// ─── Dashboard ─────────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalUsers: number;
  vipUsers: number;
  examsToday: number;
  activeUsers7d: number;
}

export interface DailySignup {
  date: string; // ISO date string 'YYYY-MM-DD'
  count: number;
}

export interface AdminDashboardResponse {
  stats: AdminDashboardStats;
  dailySignups: DailySignup[]; // 30 ngày gần nhất
  pendingSubscriptions: number;
  openReports: number;
}

// ─── Users ─────────────────────────────────────────────────────────────────

export type UserRole = 'STANDARD' | 'VIP' | 'ADMIN';

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  isBanned: boolean;
  banReason: string | null;
  vipExpiresAt: string | null;
  createdAt: string;
  examCount: number; // số bài thi đã làm
}

export interface AdminUsersResponse {
  users: AdminUserItem[];
  pagination: PaginationMeta;
}

export interface UserUpdateBody {
  role?: UserRole;
  isBanned?: boolean;
  banReason?: string | null;
  vipExpiresAt?: string | null;
}

// ─── Subscriptions ─────────────────────────────────────────────────────────

export type SubscriptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type SubscriptionPlan = '1m' | '3m' | '12m';

export interface AdminSubscriptionItem {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  status: SubscriptionStatus;
  plan: SubscriptionPlan | null;
  proofImageUrl: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSubscriptionsResponse {
  subscriptions: AdminSubscriptionItem[];
  pagination: PaginationMeta;
}

export interface SubscriptionUpdateBody {
  status: 'APPROVED' | 'REJECTED';
  plan?: SubscriptionPlan;       // bắt buộc khi status = APPROVED
  rejectReason?: string;         // bắt buộc khi status = REJECTED
}

// ─── Questions ─────────────────────────────────────────────────────────────

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type OptionLabel = 'A' | 'B' | 'C' | 'D';
export type QuestionStatus = 'DRAFT' | 'PUBLISHED';

export interface QuestionOption {
  label: OptionLabel;
  text: string;
  isCorrect: boolean;
}

export interface QuestionCreateBody {
  examId: string;
  order: number;
  passage?: string;
  questionText: string;
  options: QuestionOption[];    // phải có đúng 1 isCorrect=true
  explanation: string;          // min 20 ký tự
  grammarTopic: string;
  difficulty: QuestionDifficulty;
  status?: QuestionStatus;      // default 'DRAFT'
}

export interface QuestionUpdateBody {
  order?: number;
  passage?: string;
  questionText?: string;
  options?: QuestionOption[];
  explanation?: string;
  grammarTopic?: string;
  difficulty?: QuestionDifficulty;
  status?: QuestionStatus;
}

export type ExamPart = 'PART5' | 'PART6' | 'PART7' | 'FULL';
export type ExamType = 'FREE' | 'VIP';

export interface ExamCreateBody {
  title: string;
  part: ExamPart;
  difficulty: QuestionDifficulty;
  type: ExamType;
  duration: number;
}

export interface ExamUpdateBody {
  title?: string;
  part?: ExamPart;
  difficulty?: QuestionDifficulty;
  type?: ExamType;
  duration?: number;
}

export interface BroadcastBody {
  title: string;
  body: string;
  targetRole?: 'STANDARD' | 'VIP';
}

export interface BroadcastResponse {
  sent: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
