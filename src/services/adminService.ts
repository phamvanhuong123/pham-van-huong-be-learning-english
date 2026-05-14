import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import ApiError from '../utils/ApiError';
import { deleteAsset, getPublicIdFromUrl } from '../utils/cloudinary';
import { getTransporter, getPreviewUrl } from '../config/mailer';
import { vipApprovedTemplate, vipRejectedTemplate } from '../utils/adminEmailTemplates';
import { env } from '../config/env';
import * as notificationService from './notificationService';
import {
  AdminDashboardResponse,
  AdminUsersResponse,
  UserUpdateBody,
  AdminSubscriptionsResponse,
  SubscriptionUpdateBody,
  PassageGroupCreateBody,
  GrammarTopicCreateBody,
  GrammarTopicUpdateBody,
  GrammarTopicItem,
  QuestionUpdateBody,
  QuestionCreateBody,
  AdminExamsResponse,
  BroadcastBody,
  BroadcastResponse,
  ExamCreateBody,
  ExamUpdateBody,
  AdminQuestionsResponse,
  AdminBroadcastsResponse,
  AdminQuestionItem,
} from '../types/admin';
import { StatusCodes } from 'http-status-codes';
import { socketEmitter } from '../sockets/socketEmitter';

const FROM = `"TOEIC Master" <${env.SMTP_FROM || env.SMTP_USER || 'noreply@toeicmaster.vn'}>`;

const PLAN_DAYS: Record<string, number> = {
  '1m': 30,
  '3m': 90,
  '12m': 365,
};

const sendEmailSilent = async (to: string, subject: string, html: string, text: string) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({ from: FROM, to, subject, html, text });
    const previewUrl = getPreviewUrl(info);
    if (previewUrl) {
      console.log(`[Admin][Email] Ethereal preview → ${previewUrl}`);
    } else {
      console.log(`[Admin][Email] Đã gửi tới ${to} — MessageId: ${info.messageId}`);
    }
  } catch (err) {
    console.error(`[Admin][Email] Gửi tới ${to} thất bại:`, err);
  }
};

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
    const key = u.createdAt.toISOString().slice(0, 10); 
    signupMap.set(key, (signupMap.get(key) ?? 0) + 1);
  }


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
    openReports: 0, 
  };
};

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
export const updateUser = async (
  targetUserId: string,
  requestingAdminId: string,
  body: UserUpdateBody,
): Promise<void> => {
  if (targetUserId === requestingAdminId) {
    throw new ApiError('Không thể sửa tài khoản của chính mình', StatusCodes.FORBIDDEN);
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new ApiError('Người dùng không tồn tại', StatusCodes.NOT_FOUND);
  }

  const updateData: Parameters<typeof prisma.user.update>[0]['data'] = {};

  if (body.role !== undefined) {
    updateData.role = body.role;
  }
  if (body.isBanned !== undefined) {
    updateData.isBanned = body.isBanned;
  }
  if (body.vipExpiresAt !== undefined) {
    updateData.vipExpiresAt = body.vipExpiresAt ? new Date(body.vipExpiresAt) : null;
  }

  await prisma.user.update({ where: { id: targetUserId }, data: updateData });
};

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
      rejectReason: null, 
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

export const updateSubscription = async (
  subId: string,
  body: SubscriptionUpdateBody,
): Promise<void> => {
  if (body.status === 'APPROVED' && !body.plan) {
    throw new ApiError('Vui lòng chọn gói VIP khi phê duyệt (1m, 3m, 12m)', StatusCodes.BAD_REQUEST);
  }
  if (body.status === 'REJECTED' && !body.rejectReason?.trim()) {
    throw new ApiError('Vui lòng nhập lý do từ chối', StatusCodes.BAD_REQUEST);
  }

  const sub = await prisma.subscription.findUnique({
    where: { id: subId },
    include: { user: { select: { id: true, name: true, email: true, role: true, vipExpiresAt: true } } },
  });
  if (!sub) {
    throw new ApiError('Không tìm thấy yêu cầu VIP này', StatusCodes.NOT_FOUND);
  }
  if (sub.status !== 'PENDING') {
    throw new ApiError('Yêu cầu này đã được xử lý trước đó', StatusCodes.CONFLICT);
  }

  if (body.status === 'APPROVED') {
    const days = PLAN_DAYS[body.plan!];
    if (!days) {
      throw new ApiError('Gói VIP không hợp lệ', StatusCodes.BAD_REQUEST);
    }
    //Nếu đang là VIP và chưa hết hạn thì cộng dồn vào ngày hết hạn cũ
    const now = new Date();
    const baseDate = (sub.user.role === 'VIP' && sub.user.vipExpiresAt && sub.user.vipExpiresAt > now)
      ? new Date(sub.user.vipExpiresAt)
      : now;

    const expiresAt = new Date(baseDate);
    expiresAt.setDate(expiresAt.getDate() + days);
    const startsAt = now;

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

    // Thông báo trong app
    await notificationService.createNotification(
      sub.userId,
      ' Tài khoản VIP đã được kích hoạt',
      `Chúc mừng! Yêu cầu nâng cấp VIP của bạn đã được phê duyệt. Hạn dùng đến: ${formattedExpiry}.`
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

    await notificationService.createNotification(
      sub.userId,
      ' Yêu cầu VIP bị từ chối',
      `Rất tiếc, yêu cầu nâng cấp VIP của bạn không được phê duyệt. Lý do: ${body.rejectReason}`
    );
  }
};

export const deleteSubscription = async (subId: string): Promise<void> => {
  const sub = await prisma.subscription.findUnique({ where: { id: subId } });
  if (!sub) {
    throw new ApiError('Không tìm thấy yêu cầu VIP này', StatusCodes.NOT_FOUND);
  }
  
  await prisma.subscription.delete({ where: { id: subId } });
};

export const createQuestion = async (body: QuestionCreateBody) => {
  const correctCount = body.options.filter((o) => o.isCorrect).length;
  if (correctCount !== 1) {
    throw new ApiError(
      `Phải có đúng 1 đáp án đúng. Hiện tại có ${correctCount} đáp án được đánh dấu đúng.`,
      StatusCodes.BAD_REQUEST,
    );
  }
  if (body.explanation.trim().length < 20) {
    throw new ApiError('Phần giải thích phải có ít nhất 20 ký tự', StatusCodes.BAD_REQUEST);
  }

  const question = await prisma.question.create({
    data: {
      examId: body.examId ?? null,
      passageGroupId: body.passageGroupId ?? null,
      order: body.order,
      questionText: body.questionText,
      grammarTopic: body.grammarTopic,
      grammarTopicId: body.grammarTopicId ?? null,
      explanation: body.explanation,
      difficulty: body.difficulty as any,
      metadata: body.metadata,
      options: {
        create: body.options.map((o) => ({
          label: o.label,
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      },
    },
    include: { options: true, exam: { select: { title: true } }, grammarTopicRel: true },
  });

  return question;
};

export const updateQuestion = async (questionId: string, body: QuestionUpdateBody) => {
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    throw new ApiError('Không tìm thấy câu hỏi', StatusCodes.NOT_FOUND);
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

  const updateData: any = {};
  if (body.examId !== undefined) updateData.examId = body.examId;
  if (body.order !== undefined) updateData.order = body.order;
  if (body.passageGroupId !== undefined) updateData.passageGroupId = body.passageGroupId;
  if (body.questionText !== undefined) updateData.questionText = body.questionText;
  if (body.grammarTopic !== undefined) updateData.grammarTopic = body.grammarTopic;
  if (body.grammarTopicId !== undefined) updateData.grammarTopicId = body.grammarTopicId;
  if (body.explanation !== undefined) updateData.explanation = body.explanation;
  if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
  if (body.metadata !== undefined) updateData.metadata = body.metadata;

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
  });
  if (!question) {
    throw new ApiError('Không tìm thấy câu hỏi', 404);
  }

  // Chuyển sang xóa mềm
  await prisma.question.update({ 
    where: { id: questionId }, 
    data: { isDeleted: true } 
  });
};

export const restoreQuestion = async (questionId: string): Promise<void> => {
  await prisma.question.update({
    where: { id: questionId },
    data: { isDeleted: false },
  });
};

export const hardDeleteQuestion = async (questionId: string): Promise<void> => {
  // 1. Tìm thông tin media của câu hỏi (nếu có thông qua PassageGroup)
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { passageGroup: { include: { passages: true } } }
  });

  if (question) {
    await cleanupQuestionsAssets([question]);
  }

  // 2. Xóa trong DB
  await prisma.question.delete({ where: { id: questionId } });
};

export const createExam = async (body: ExamCreateBody) => {
  const exam = await prisma.exam.create({
    data: {
      title: body.title,
      part: body.part as any,
      difficulty: body.difficulty,
      type: body.type,
      duration: body.duration,
      isPublished: false,
    },
  });

  // Nếu là đề FULL: gán parentExamId cho các đề con
  if (body.part === 'FULL' && body.componentExamIds && body.componentExamIds.length > 0) {
    // Kiểm tra tất cả đề con tồn tại
    const childExams = await prisma.exam.findMany({
      where: { id: { in: body.componentExamIds } },
    });
    if (childExams.length !== body.componentExamIds.length) {
      // Rollback: xóa đề vừa tạo
      await prisma.exam.delete({ where: { id: exam.id } });
      throw new ApiError('Một hoặc nhiều đề thành phần không tồn tại', StatusCodes.BAD_REQUEST);
    }
    // Cập nhật parentExamId cho từng đề con
    await prisma.exam.updateMany({
      where: { id: { in: body.componentExamIds } },
      data: { parentExamId: exam.id },
    });
  }

  return exam;
};

export const deletePassageGroup = async (id: string) => {
  // 1. Tìm thông tin cụm và các passages đi kèm
  const group = await prisma.passageGroup.findUnique({
    where: { id },
    include: { passages: true }
  });

  if (!group) {
    throw new ApiError('Không tìm thấy cụm nội dung', StatusCodes.NOT_FOUND);
  }

  // 2. Kiểm tra xem có câu hỏi nào đang dùng cụm này không
  const questionsCount = await prisma.question.count({
    where: { passageGroupId: id }
  });

  if (questionsCount > 0) {
    throw new ApiError('Không thể xóa cụm này vì đang có câu hỏi sử dụng nó.', StatusCodes.BAD_REQUEST);
  }

  // 3. Xóa các file trên Cloudinary (nếu có)
  for (const passage of group.passages) {
    if (passage.mediaUrl) {
      const publicId = getPublicIdFromUrl(passage.mediaUrl);
      if (publicId) {
        const resourceType = passage.mediaType === 'AUDIO' || passage.mediaType === 'VIDEO' ? 'video' : 'image';
        await deleteAsset(publicId, resourceType);
      }
    }
  }

  // 4. Xóa trong DB
  return prisma.passageGroup.delete({
    where: { id }
  });
};

export const updateExam = async (examId: string, body: ExamUpdateBody & { isPublished?: boolean }) => {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) {
    throw new ApiError('Không tìm thấy đề thi', StatusCodes.NOT_FOUND);
  }

  const updateData: Parameters<typeof prisma.exam.update>[0]['data'] = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.part !== undefined) updateData.part = body.part as any;
  if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.duration !== undefined) updateData.duration = body.duration;
  if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;

  return prisma.exam.update({ where: { id: examId }, data: updateData });
};

export const broadcastNotification = async (body: BroadcastBody): Promise<BroadcastResponse> => {
  const where: Prisma.UserWhereInput = {};

  if (body.targetRole === 'STANDARD') {
    where.role = 'STANDARD';
  } else if (body.targetRole === 'VIP') {
    where.role = 'VIP';
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  if (users.length === 0) {
    throw new ApiError('Không tìm thấy người dùng mục tiêu', StatusCodes.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    const broadcast = await tx.broadcast.create({
      data: {
        title: body.title,
        body: body.body,
        targetRole: body.targetRole,
      },
    });

    // 2. Tạo thông báo cho từng User
    await tx.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        broadcastId: broadcast.id,
        title: body.title,
        body: body.body,
        isRead: false,
      })),
    });
  });

  // Gửi thông báo realtime
  const socketData = {
    title: body.title,
    body: body.body,
    createdAt: new Date().toISOString(),
  };

  if (body.targetRole === 'ALL') {
    socketEmitter.broadcast('new_notification', socketData);
  } else {
    socketEmitter.emitToRole(body.targetRole, 'new_notification', socketData);
  }

  return { sent: users.length };
};

export const getAdminBroadcasts = async (): Promise<AdminBroadcastsResponse> => {
  const broadcasts = await prisma.broadcast.findMany({
    orderBy: { sentAt: 'desc' },
    include: {
      _count: { select: { notifications: true } },
    },
  });

  return {
    broadcasts: broadcasts.map((b) => ({
      id: b.id,
      title: b.title,
      body: b.body,
      targetRole: b.targetRole,
      sentAt: b.sentAt.toISOString(),
      _count: b._count,
    })),
  };
};

export const deleteAdminBroadcast = async (id: string): Promise<void> => {
  const broadcast = await prisma.broadcast.findUnique({ where: { id } });
  if (!broadcast) {
    throw new ApiError('Không tìm thấy đợt thông báo này', StatusCodes.NOT_FOUND);
  }

  // Do chúng ta dùng onDelete: Cascade trong schema nên khi xóa Broadcast,
  // tất cả Notifications liên quan sẽ bị xóa tự động khỏi hộp thư của User.
  await prisma.broadcast.delete({ where: { id } });
};


export const getAdminQuestions = async (query: {
  search?: string;
  examId?: string;
  difficulty?: string;
  page?: string;
  limit?: string;
  passage?: string;
}): Promise<AdminQuestionsResponse> => {
  const page = Math.max(1, parseInt(query.page ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
  const skip = (page - 1) * limit;

  const where: Prisma.QuestionWhereInput = { isDeleted: false };

  if (query.search) {
    where.OR = [
      { questionText: { contains: query.search, mode: 'insensitive' } },
      { grammarTopic: { contains: query.search, mode: 'insensitive' } },
      {
        passageGroup: {
          passages: {
            some: {
              content: { contains: query.search, mode: 'insensitive' }
            }
          }
        }
      }
    ];
  }

  if (query.passage) {
    where.passageGroup = {
      passages: {
        some: {
          content: { contains: query.passage, mode: 'insensitive' }
        }
      }
    };
  }

  if (query.examId && query.examId !== 'ALL') {
    where.examId = query.examId;
  }

  if (query.difficulty && query.difficulty !== 'ALL') {
    where.exam = {
      difficulty: query.difficulty as any,
    };
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        options: true,
        exam: { select: { title: true, difficulty: true } },
        grammarTopicRel: true,
        passageGroup: {
          include: { passages: true }
        }
      },
    }),
    prisma.question.count({ where }),
  ]);

  return {
    questions: questions.map((q) => ({
      id: q.id,
      examId: q.examId,
      examTitle: q.exam?.title,
      order: q.order,
      passageGroup: q.passageGroup,
      passageGroupId: q.passageGroupId,
      questionText: q.questionText,
      grammarTopic: q.grammarTopicRel?.name ?? q.grammarTopic,
      explanation: q.explanation,
      difficulty: q.difficulty ?? (q.exam?.difficulty as any),
      options: q.options.map((o) => ({
        label: o.label,
        text: o.text,
        isCorrect: o.isCorrect,
      })),
      createdAt: q.createdAt.toISOString(),
    } as AdminQuestionItem)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAdminExams = async (): Promise<AdminExamsResponse> => {
  const examInclude = Prisma.validator<Prisma.ExamInclude>()({
    _count: { select: { questions: true } },
    childExams: {
      select: { id: true, title: true, part: true },
    },
  });

  const exams = await prisma.exam.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: 'desc' },
    include: examInclude,
  });

  type ExamWithInclude = Prisma.ExamGetPayload<{ include: typeof examInclude }>;

  return {
    exams: (exams as ExamWithInclude[]).map((e) => ({
      id: e.id,
      title: e.title,
      part: e.part,
      difficulty: e.difficulty as any,
      type: e.type,
      duration: e.duration,
      isPublished: e.isPublished,
      questionCount: e._count.questions,
      parentExamId: e.parentExamId,
      childExams: e.childExams.map((c) => ({ id: c.id, title: c.title, part: c.part })),
      createdAt: e.createdAt.toISOString(),
    })),
  };
};

export const createPassageGroup = async (body: PassageGroupCreateBody) => {
  return prisma.passageGroup.create({
    data: {
      examId: body.examId,
      order: body.order,
      passages: {
        create: body.passages.map((p: any) => ({
          content: p.content,
          order: p.order,
          mediaUrl: p.mediaUrl,
          mediaType: p.mediaType,
        })),
      },
      questions: body.questions && body.questions.length > 0 ? {
        create: body.questions.map((q: any) => ({
          examId: body.examId,
          order: q.order,
          questionText: q.questionText,
          explanation: q.explanation,
          grammarTopic: q.grammarTopic,
          difficulty: q.difficulty,
          metadata: q.metadata,
          options: {
            create: q.options.map((o: any) => ({
              label: o.label,
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          },
        })),
      } : undefined    },
    include: {
      passages: true,
      questions: {
        include: { options: true },
      },
    },
  });
};

export const updatePassageGroup = async (groupId: string, body: { passages: any[] }) => {
  // 1. Tìm cụm cũ để lấy danh sách URL trước khi xóa
  const oldGroup = await prisma.passageGroup.findUnique({
    where: { id: groupId },
    include: { passages: true }
  });

  if (oldGroup) {
    const oldUrls = oldGroup.passages.map(p => p.mediaUrl).filter(Boolean) as string[];
    const newUrls = body.passages.map(p => p.mediaUrl).filter(Boolean) as string[];

    // Tìm các URL cũ không còn xuất hiện trong danh sách mới (đã bị xóa hoặc thay đổi)
    const urlsToDelete = oldUrls.filter(url => !newUrls.includes(url));

    for (const url of urlsToDelete) {
      const passage = oldGroup.passages.find(p => p.mediaUrl === url);
      const publicId = getPublicIdFromUrl(url);
      if (publicId && passage) {
        const resourceType = passage.mediaType === 'AUDIO' || passage.mediaType === 'VIDEO' ? 'video' : 'image';
        await deleteAsset(publicId, resourceType);
      }
    }
  }

  // 2. Xóa passage cũ và tạo lại (đơn giản nhất)
  await prisma.passage.deleteMany({
    where: { passageGroupId: groupId }
  });

  return prisma.passageGroup.update({
    where: { id: groupId },
    data: {
      passages: {
        create: body.passages.map((p: any) => ({
          content: p.content,
          order: p.order,
          mediaUrl: p.mediaUrl,
          mediaType: p.mediaType,
        })),
      }
    },
    include: { passages: true }
  });
};

export const getPassageGroupsByExam = async (examId: string) => {
  return prisma.passageGroup.findMany({
    where: { examId },
    orderBy: { order: 'asc' },
    include: { passages: true },
  });
};

// --- Recycle Bin Logic ---

export const deleteExam = async (examId: string): Promise<void> => {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) throw new ApiError('Không tìm thấy đề thi', StatusCodes.NOT_FOUND);

  // Xóa mềm đề thi
  await prisma.exam.update({
    where: { id: examId },
    data: { isDeleted: true },
  });
};

export const restoreExam = async (examId: string): Promise<void> => {
  await prisma.exam.update({
    where: { id: examId },
    data: { isDeleted: false },
  });
};

export const hardDeleteExam = async (examId: string): Promise<void> => {
  const exam = await prisma.exam.findUnique({ 
    where: { id: examId },
    include: { 
      passageGroups: { include: { passages: true } }
    }
  });
  if (!exam) throw new ApiError('Không tìm thấy đề thi', StatusCodes.NOT_FOUND);

  // 1. Xóa các file media của đề thi này
  for (const group of exam.passageGroups) {
    for (const passage of group.passages) {
      if (passage.mediaUrl) {
        const publicId = getPublicIdFromUrl(passage.mediaUrl);
        if (publicId) {
          const resourceType = passage.mediaType === 'AUDIO' || passage.mediaType === 'VIDEO' ? 'video' : 'image';
          await deleteAsset(publicId, resourceType);
        }
      }
    }
  }

  // 2. Xóa thẳng đề thi
  await prisma.exam.delete({ where: { id: examId } });
};

export const getDeletedItems = async () => {
  const [exams, questions] = await Promise.all([
    prisma.exam.findMany({
      where: { isDeleted: true },
      include: { _count: { select: { questions: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.question.findMany({
      where: { isDeleted: true },
      include: { exam: { select: { title: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  return {
    exams: exams.map(e => ({
      id: e.id,
      title: e.title,
      part: e.part,
      questionCount: e._count.questions,
      deletedAt: e.updatedAt,
    })),
    questions: questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      examTitle: (q as any).exam?.title || 'Đề thi không xác định',
      deletedAt: q.updatedAt,
    })),
  };
};

// --- Bulk Operations ---

export const bulkDeleteExams = async (ids: string[]) => {
  return prisma.exam.updateMany({
    where: { id: { in: ids } },
    data: { isDeleted: true },
  });
};

export const bulkRestoreExams = async (ids: string[]) => {
  return prisma.exam.updateMany({
    where: { id: { in: ids } },
    data: { isDeleted: false },
  });
};

export const bulkHardDeleteExams = async (ids: string[]) => {
  // 1. Lấy thông tin media của tất cả đề thi được chọn
  const exams = await prisma.exam.findMany({
    where: { id: { in: ids } },
    include: { 
      passageGroups: { include: { passages: true } }
    }
  });

  for (const exam of exams) {
    for (const group of exam.passageGroups) {
      for (const passage of group.passages) {
        if (passage.mediaUrl) {
          const publicId = getPublicIdFromUrl(passage.mediaUrl);
          if (publicId) {
            const resourceType = passage.mediaType === 'AUDIO' || passage.mediaType === 'VIDEO' ? 'video' : 'image';
            await deleteAsset(publicId, resourceType);
          }
        }
      }
    }
  }

  return prisma.exam.deleteMany({
    where: { id: { in: ids } },
  });
};

export const bulkDeleteQuestions = async (ids: string[]) => {
  return prisma.question.updateMany({
    where: { id: { in: ids } },
    data: { isDeleted: true },
  });
};

export const bulkRestoreQuestions = async (ids: string[]) => {
  return prisma.question.updateMany({
    where: { id: { in: ids } },
    data: { isDeleted: false },
  });
};

export const bulkHardDeleteQuestions = async (ids: string[]) => {
  // 1. Lấy thông tin media của các câu hỏi
  const questions = await prisma.question.findMany({
    where: { id: { in: ids } },
    include: { passageGroup: { include: { passages: true } } }
  });

  await cleanupQuestionsAssets(questions);

  return prisma.question.deleteMany({
    where: { id: { in: ids } },
  });
};

// --- Helper Functions ---

async function cleanupQuestionsAssets(questions: any[]) {
  // Trong TOEIC, media thường nằm ở PassageGroup của câu hỏi đó
  // (Trừ khi câu hỏi đó dùng chung PassageGroup với câu khác, nhưng khi xóa hết câu hỏi của 1 PassageGroup thì PassageGroup cũng thường bị xóa theo hoặc mồ côi)
  // Lưu ý: Logic này tập trung vào các file media gắn liền với các câu hỏi đang bị xóa vĩnh viễn.
  for (const q of questions) {
    if (q.passageGroup) {
      for (const passage of q.passageGroup.passages) {
        if (passage.mediaUrl) {
          const publicId = getPublicIdFromUrl(passage.mediaUrl);
          if (publicId) {
            const resourceType = passage.mediaType === 'AUDIO' || passage.mediaType === 'VIDEO' ? 'video' : 'image';
            await deleteAsset(publicId, resourceType);
          }
        }
      }
    }
    
    // Kiểm tra thêm trong metadata nếu có mediaUrl (một số dạng đề cũ)
    if (q.metadata && typeof q.metadata === 'object') {
      const meta = q.metadata as any;
      if (meta.mediaUrl) {
        const publicId = getPublicIdFromUrl(meta.mediaUrl);
        if (publicId) {
          const resourceType = meta.mediaType === 'AUDIO' || meta.mediaType === 'VIDEO' ? 'video' : 'image';
          await deleteAsset(publicId, resourceType);
        }
      }
    }
  }
}

// ─── Grammar Topics ───────────────────────────────────────────────────────

export const getAdminGrammarTopics = async (): Promise<GrammarTopicItem[]> => {
  const topics = await prisma.grammarTopic.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { questions: true } },
    },
  });

  return topics.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    _count: t._count,
  }));
};

export const createGrammarTopic = async (body: GrammarTopicCreateBody): Promise<GrammarTopicItem> => {
  const existing = await prisma.grammarTopic.findUnique({ where: { slug: body.slug } });
  if (existing) {
    throw new ApiError('Slug này đã tồn tại', StatusCodes.CONFLICT);
  }

  const topic = await prisma.grammarTopic.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description,
    },
  });

  return {
    ...topic,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
  };
};

export const updateGrammarTopic = async (
  id: string,
  body: GrammarTopicUpdateBody,
): Promise<GrammarTopicItem> => {
  const topic = await prisma.grammarTopic.findUnique({ where: { id } });
  if (!topic) {
    throw new ApiError('Không tìm thấy chủ đề ngữ pháp', StatusCodes.NOT_FOUND);
  }

  if (body.slug && body.slug !== topic.slug) {
    const existing = await prisma.grammarTopic.findUnique({ where: { slug: body.slug } });
    if (existing) {
      throw new ApiError('Slug này đã tồn tại', StatusCodes.CONFLICT);
    }
  }

  const updated = await prisma.grammarTopic.update({
    where: { id },
    data: body,
  });

  return {
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
};

export const deleteGrammarTopic = async (id: string): Promise<void> => {
  const topic = await prisma.grammarTopic.findUnique({ where: { id } });
  if (!topic) {
    throw new ApiError('Không tìm thấy chủ đề ngữ pháp', StatusCodes.NOT_FOUND);
  }

  await prisma.grammarTopic.delete({ where: { id } });
};
