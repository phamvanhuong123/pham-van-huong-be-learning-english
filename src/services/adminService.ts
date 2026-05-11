/**
 * Admin Service — Phase 6
 * Business logic cho tất cả Admin endpoints.
 * Dùng Prisma transaction để đảm bảo atomicity khi approve subscription.
 */

import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import ApiError from '../utils/ApiError';
import { getTransporter, getPreviewUrl } from '../config/mailer';
import { vipApprovedTemplate, vipRejectedTemplate } from '../utils/adminEmailTemplates';
import { env } from '../config/env';
import type {
  AdminDashboardResponse,
  AdminUsersResponse,
  UserUpdateBody,
  AdminSubscriptionsResponse,
  SubscriptionUpdateBody,
  QuestionCreateBody,
  QuestionUpdateBody,
  ExamCreateBody,
  ExamUpdateBody,
  BroadcastBody,
  BroadcastResponse,
} from '../types/admin';

const FROM = `"TOEIC Master" <${env.SMTP_FROM || env.SMTP_USER || 'noreply@toeicmaster.vn'}>`;

// ─── Plan → days mapping ────────────────────────────────────────────────────
const PLAN_DAYS: Record<string, number> = {
  '1m': 30,
  '3m': 90,
  '12m': 365,
};

// ─── Difficulty label → Int (theo Prisma schema Exam.difficulty: Int) ────────
const DIFFICULTY_MAP: Record<string, number> = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
};

// ─── Helper: gửi email không throw (fire & forget) ─────────────────────────
const sendEmailSilent = async (to: string, subject: string, html: string, text: string) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({ from: FROM, to, subject, html, text });
    const previewUrl = getPreviewUrl(info);
    if (previewUrl) {
      console.log(`📧 [Admin][Email] Ethereal preview → ${previewUrl}`);
    } else {
      console.log(`📧 [Admin][Email] Đã gửi tới ${to} — MessageId: ${info.messageId}`);
    }
  } catch (err) {
    // Không throw — DB đã commit, email chỉ là side effect phụ
    console.error(`❌ [Admin][Email] Gửi tới ${to} thất bại:`, err);
  }
};

/* ══════════════════════════════════════════════════════════════
   1. GET /api/admin/dashboard
══════════════════════════════════════════════════════════════ */
export const getAdminDashboard = async (): Promise<AdminDashboardResponse> => {
  const now = new Date();
  const startOf7DaysAgo = new Date(now);
  startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);
  startOf7DaysAgo.setHours(0, 0, 0, 0);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // Chạy song song tất cả queries
  const [totalUsers, vipUsers, examsToday, activeUsers7d, pendingSubscriptions, signups] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'VIP' } }),
      prisma.result.count({ where: { submittedAt: { gte: startOfToday } } }),
      prisma.user.count({
        where: { results: { some: { submittedAt: { gte: startOf7DaysAgo } } } },
      }),
      prisma.subscription.count({ where: { status: 'PENDING' } }),
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

  // Nhóm đăng ký theo ngày (30 ngày gần nhất)
  const signupMap = new Map<string, number>();
  for (const u of signups) {
    const key = u.createdAt.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    signupMap.set(key, (signupMap.get(key) ?? 0) + 1);
  }

  // Tạo array 30 ngày đầy đủ (ngày không có đăng ký → count = 0)
  const dailySignups: Array<{ date: string; count: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailySignups.push({ date: key, count: signupMap.get(key) ?? 0 });
  }

  return {
    stats: { totalUsers, vipUsers, examsToday, activeUsers7d },
    dailySignups,
    pendingSubscriptions,
    openReports: 0, // placeholder — chưa có Report model trong schema
  };
};

/* ══════════════════════════════════════════════════════════════
   2. GET /api/admin/users
══════════════════════════════════════════════════════════════ */
export const getAdminUsers = async (query: {
  role?: string;
  status?: string;
  search?: string;
  page?: string;
  limit?: string;
}): Promise<AdminUsersResponse> => {
  const page = Math.max(1, parseInt(query.page ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.UserWhereInput = {};

  if (query.role && ['STANDARD', 'VIP', 'ADMIN'].includes(query.role)) {
    where.role = query.role as 'STANDARD' | 'VIP' | 'ADMIN';
  }
  if (query.status === 'banned') {
    where.isBanned = true;
  } else if (query.status === 'active') {
    where.isBanned = false;
  }
  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: 'insensitive' } },
      { name: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        isBanned: true,
        vipExpiresAt: true,
        createdAt: true,
        _count: { select: { results: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      name: u.name ?? '',
      email: u.email,
      avatarUrl: u.avatarUrl ?? null,
      role: u.role,
      isBanned: u.isBanned,
      banReason: null, // schema không có banReason field
      vipExpiresAt: u.vipExpiresAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      examCount: u._count.results,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/* ══════════════════════════════════════════════════════════════
   3. PATCH /api/admin/users/:userId
   Guard: Admin không được sửa chính mình
══════════════════════════════════════════════════════════════ */
export const updateUser = async (
  targetUserId: string,
  requestingAdminId: string,
  body: UserUpdateBody,
): Promise<void> => {
  // ⛔ Edge case: admin tự sửa mình
  if (targetUserId === requestingAdminId) {
    throw new ApiError('Không thể sửa tài khoản của chính mình', 403);
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new ApiError('Người dùng không tồn tại', 404);
  }

  const updateData: Parameters<typeof prisma.user.update>[0]['data'] = {};

  if (body.role !== undefined) {
    updateData.role = body.role;
  }
  if (body.isBanned !== undefined) {
    updateData.isBanned = body.isBanned;
    // Nếu unban, clear vipExpiresAt không cần thiết nhưng đảm bảo nhất quán
    if (!body.isBanned) {
      // không reset vipExpiresAt — chỉ clear ban
    }
  }
  if (body.vipExpiresAt !== undefined) {
    updateData.vipExpiresAt = body.vipExpiresAt ? new Date(body.vipExpiresAt) : null;
  }

  await prisma.user.update({ where: { id: targetUserId }, data: updateData });
};

/* ══════════════════════════════════════════════════════════════
   4. GET /api/admin/subscriptions
══════════════════════════════════════════════════════════════ */
export const getAdminSubscriptions = async (query: {
  status?: string;
  page?: string;
  limit?: string;
}): Promise<AdminSubscriptionsResponse> => {
  const page = Math.max(1, parseInt(query.page ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
  const skip = (page - 1) * limit;

  const where: Prisma.SubscriptionWhereInput = {};
  if (query.status && ['PENDING', 'APPROVED', 'REJECTED'].includes(query.status)) {
    where.status = query.status as 'PENDING' | 'APPROVED' | 'REJECTED';
  }

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, avatarUrl: true } },
      },
    }),
    prisma.subscription.count({ where }),
  ]);

  return {
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      userId: s.userId,
      user: {
        name: s.user.name ?? '',
        email: s.user.email,
        avatarUrl: s.user.avatarUrl ?? null,
      },
      status: s.status,
      plan: s.plan as '1m' | '3m' | '12m' | null,
      proofImageUrl: s.proofUrl ?? null,
      rejectReason: null, // schema không có rejectReason field
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/* ══════════════════════════════════════════════════════════════
   5. PATCH /api/admin/subscriptions/:subId
   APPROVED: Prisma transaction → update sub + update user + send email
   REJECTED: update sub + send email
══════════════════════════════════════════════════════════════ */
export const updateSubscription = async (
  subId: string,
  body: SubscriptionUpdateBody,
): Promise<void> => {
  // Validate body
  if (body.status === 'APPROVED' && !body.plan) {
    throw new ApiError('Vui lòng chọn gói VIP khi phê duyệt (1m, 3m, 12m)', 400);
  }
  if (body.status === 'REJECTED' && !body.rejectReason?.trim()) {
    throw new ApiError('Vui lòng nhập lý do từ chối', 400);
  }

  const sub = await prisma.subscription.findUnique({
    where: { id: subId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!sub) {
    throw new ApiError('Không tìm thấy yêu cầu VIP này', 404);
  }
  if (sub.status !== 'PENDING') {
    throw new ApiError('Yêu cầu này đã được xử lý trước đó', 409);
  }

  if (body.status === 'APPROVED') {
    const days = PLAN_DAYS[body.plan!];
    if (!days) {
      throw new ApiError('Gói VIP không hợp lệ', 400);
    }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    const startsAt = new Date();

    // ⚡ Transaction: commit cả 2 DB operation hoặc rollback cả 2
    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: subId },
        data: { status: 'APPROVED', plan: body.plan, startsAt, expiresAt },
      }),
      prisma.user.update({
        where: { id: sub.userId },
        data: { role: 'VIP', vipExpiresAt: expiresAt },
      }),
    ]);

    // Gửi email sau khi DB commit thành công (fire & forget)
    const formattedExpiry = expiresAt.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    await sendEmailSilent(
      sub.user.email,
      'Chúc mừng, tài khoản VIP của bạn đã được kích hoạt — TOEIC Master',
      vipApprovedTemplate({
        name: sub.user.name ?? sub.user.email,
        expiresAt: formattedExpiry,
        clientUrl: env.CLIENT_URL,
      }),
      `Chúc mừng ${sub.user.name ?? sub.user.email}! Tài khoản VIP của bạn đã được kích hoạt đến ${formattedExpiry}.`,
    );
  } else {
    // REJECTED
    await prisma.subscription.update({
      where: { id: subId },
      data: { status: 'REJECTED' },
    });

    // Gửi email thông báo từ chối (fire & forget)
    await sendEmailSilent(
      sub.user.email,
      'Yêu cầu VIP của bạn chưa được phê duyệt — TOEIC Master',
      vipRejectedTemplate({
        name: sub.user.name ?? sub.user.email,
        rejectReason: body.rejectReason!,
        clientUrl: env.CLIENT_URL,
      }),
      `Xin chào ${sub.user.name ?? sub.user.email}, yêu cầu VIP của bạn bị từ chối: ${body.rejectReason}`,
    );
  }
};

/* ══════════════════════════════════════════════════════════════
   6. POST /api/admin/questions
   Guard: Đúng 1 option isCorrect=true
══════════════════════════════════════════════════════════════ */
export const createQuestion = async (body: QuestionCreateBody) => {
  // Validate isCorrect
  const correctCount = body.options.filter((o) => o.isCorrect).length;
  if (correctCount !== 1) {
    throw new ApiError(
      `Phải có đúng 1 đáp án đúng. Hiện tại có ${correctCount} đáp án được đánh dấu đúng.`,
      400,
    );
  }
  if (body.explanation.trim().length < 20) {
    throw new ApiError('Phần giải thích phải có ít nhất 20 ký tự', 400);
  }

  const exam = await prisma.exam.findUnique({ where: { id: body.examId } });
  if (!exam) {
    throw new ApiError('Không tìm thấy đề thi', 404);
  }

  // Map difficulty string → int theo schema
  const question = await prisma.question.create({
    data: {
      examId: body.examId,
      order: body.order,
      passage: body.passage ?? null,
      questionText: body.questionText,
      grammarTopic: body.grammarTopic,
      explanation: body.explanation,
      options: {
        create: body.options.map((o) => ({
          label: o.label,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      },
    },
    include: { options: true },
  });

  return question;
};

export const updateQuestion = async (questionId: string, body: QuestionUpdateBody) => {
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    throw new ApiError('Không tìm thấy câu hỏi', 404);
  }

  if (body.options !== undefined) {
    const correctCount = body.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new ApiError(
        `Phải có đúng 1 đáp án đúng. Hiện tại có ${correctCount} đáp án được đánh dấu đúng.`,
        400,
      );
    }
  }
  if (body.explanation !== undefined && body.explanation.trim().length < 20) {
    throw new ApiError('Phần giải thích phải có ít nhất 20 ký tự', 400);
  }

  const updateData: Parameters<typeof prisma.question.update>[0]['data'] = {};
  if (body.order !== undefined) updateData.order = body.order;
  if (body.passage !== undefined) updateData.passage = body.passage;
  if (body.questionText !== undefined) updateData.questionText = body.questionText;
  if (body.grammarTopic !== undefined) updateData.grammarTopic = body.grammarTopic;
  if (body.explanation !== undefined) updateData.explanation = body.explanation;

  if (body.options) {
    await prisma.$transaction([
      prisma.question.update({ where: { id: questionId }, data: updateData }),
      prisma.option.deleteMany({ where: { questionId } }),
      prisma.option.createMany({
        data: body.options.map((o) => ({
          questionId,
          label: o.label,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      }),
    ]);
  } else {
    await prisma.question.update({ where: { id: questionId }, data: updateData });
  }

  return prisma.question.findUnique({ where: { id: questionId }, include: { options: true } });
};


export const deleteQuestion = async (questionId: string): Promise<void> => {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { _count: { select: { resultDetails: true } } },
  });
  if (!question) {
    throw new ApiError('Không tìm thấy câu hỏi', 404);
  }

  const usageCount = question._count.resultDetails;
  if (usageCount > 0) {
    throw new ApiError(
      `Câu hỏi đã được dùng trong ${usageCount} bài thi, không thể xóa`,
      409,
    );
  }

  await prisma.question.delete({ where: { id: questionId } });
};

export const createExam = async (body: ExamCreateBody) => {
  const difficultyInt = DIFFICULTY_MAP[body.difficulty] ?? 1;

  const exam = await prisma.exam.create({
    data: {
      title: body.title,
      part: body.part,
      difficulty: difficultyInt,
      type: body.type,
      duration: body.duration,
      isPublished: false, // default draft
    },
  });

  return exam;
};

/* ══════════════════════════════════════════════════════════════
   10. PATCH /api/admin/exams/:id
══════════════════════════════════════════════════════════════ */
export const updateExam = async (examId: string, body: ExamUpdateBody) => {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) {
    throw new ApiError('Không tìm thấy đề thi', 404);
  }

  const updateData: Parameters<typeof prisma.exam.update>[0]['data'] = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.part !== undefined) updateData.part = body.part;
  if (body.difficulty !== undefined) updateData.difficulty = DIFFICULTY_MAP[body.difficulty] ?? 1;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.duration !== undefined) updateData.duration = body.duration;

  return prisma.exam.update({ where: { id: examId }, data: updateData });
};

/* ══════════════════════════════════════════════════════════════
   11. POST /api/admin/notifications/broadcast
   Logic: targetRole undefined → tất cả, 'STANDARD' → chỉ STANDARD, 'VIP' → chỉ VIP
   Edge case: không có user match → sent = 0
══════════════════════════════════════════════════════════════ */
export const broadcastNotification = async (body: BroadcastBody): Promise<BroadcastResponse> => {
  const where: Prisma.UserWhereInput = {};

  if (body.targetRole === 'STANDARD') {
    where.role = 'STANDARD';
  } else if (body.targetRole === 'VIP') {
    where.role = 'VIP';
  }
  // targetRole undefined → where rỗng → tất cả user

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  // Edge case: không có user nào match → vẫn 200 { sent: 0 }
  if (users.length === 0) {
    return { sent: 0 };
  }

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title: body.title,
      body: body.body,
      isRead: false,
    })),
  });

  return { sent: users.length };
};
