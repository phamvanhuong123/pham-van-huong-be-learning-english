import { prisma } from "@/config/prisma";
import { scoringHelper } from "@/utils/scoringHelper";
import { OptionLabel } from "../../generated/prisma/client";
import ApiError from "@/utils/ApiError";
import { StatusCodes } from "http-status-codes";

export const clientExamService = {
  // Lấy danh sách đề thi (đã publish) có phân trang
  getPublishedExams: async (query: any) => {
    const { part, difficulty, search, page = 1, limit = 10 } = query;
    const whereClause: any = { isPublished: true, isDeleted: false };

    if (part) whereClause.part = part;
    if (difficulty) whereClause.difficulty = difficulty;
    if (search) whereClause.title = { contains: search, mode: "insensitive" };

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [exams, total] = await prisma.$transaction([
      prisma.exam.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          description: true,
          part: true,
          difficulty: true,
          type: true,
          duration: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.exam.count({ where: whereClause })
    ]);

    return {
      data: exams,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    };
  },

  // Lấy chi tiết đề thi (Lọc bỏ đáp án)
  getExamDetailsForClient: async (examId: string) => {
    const exam = await prisma.exam.findUnique({
      where: { id: examId, isPublished: true, isDeleted: false },
      include: {
        passageGroups: {
          include: {
            passages: {
              orderBy: { order: "asc" }
            },
            questions: {
              where: { isDeleted: false },
              orderBy: { order: "asc" },
              include: {
                options: true
              }
            }
          }
        },
        questions: {
          where: { isDeleted: false, passageGroupId: null },
          orderBy: { order: "asc" },
          include: {
            options: true
          }
        }
      }
    });

    if (!exam) return null;

    // Lọc bỏ đáp án và transcript (Anti-Cheat)
    const filterQuestions = (questions: any[], part: string) => {
      return questions.map(q => {
        // Part 1, 2 ẩn text câu hỏi (Part 6 cần hiện text)
        let questionText = q.questionText;
        if (['PART1', 'PART2'].includes(part)) {
          questionText = null;
        }

        return {
          id: q.id,
          order: q.order,
          questionText,
          options: q.options.map((opt: any) => {
            // Part 1, 2 ẩn text đáp án
            let text = opt.text;
            if (['PART1', 'PART2'].includes(part)) {
              text = null;
            }
            return {
              id: opt.id,
              label: opt.label,
              text: text
            };
          })
        };
      });
    };

    const mappedPassageGroups = exam.passageGroups.map(pg => ({
      id: pg.id,
      passages: pg.passages.map(p => ({
        id: p.id,
        content: p.content,
        mediaUrl: p.mediaUrl,
        mediaType: p.mediaType,
        order: p.order,
        // Bỏ transcript
      })),
      questions: filterQuestions(pg.questions, exam.part)
    }));

    const mappedStandaloneQuestions = filterQuestions(exam.questions, exam.part);

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      part: exam.part,
      difficulty: exam.difficulty,
      type: exam.type,
      duration: exam.duration,
      passageGroups: mappedPassageGroups,
      questions: mappedStandaloneQuestions
    };
  },

  // Bắt đầu làm bài
  startExam: async (examId: string, userId: string) => {
    // Check xem có Result IN_PROGRESS không
    const existingResult = await prisma.result.findFirst({
      where: { examId, userId, status: "IN_PROGRESS" },
      include: { resultDetails: true }
    });

    if (existingResult) {
      return existingResult;
    }

    // Tạo mới
    return await prisma.result.create({
      data: {
        examId,
        userId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        isFullTest: false, // Update later if needed
      }
    });
  },

  // Auto save
  autoSaveExam: async (examId: string, resultId: string, userId: string, answers: Record<string, string>, timeTaken: number, tabSwitchCount: number) => {
    const result = await prisma.result.findUnique({ where: { id: resultId } });
    if (!result || result.userId !== userId || result.examId !== examId || result.status !== "IN_PROGRESS") {
      throw new ApiError("Bài thi không hợp lệ hoặc đã nộp", StatusCodes.BAD_REQUEST);
    }

    // Cập nhật Result
    await prisma.result.update({
      where: { id: resultId },
      data: { timeTaken, tabSwitchCount }
    });

    // Upsert ResultDetail
    const upserts = Object.entries(answers).map(([questionId, selectedLabel]) => {
      return prisma.resultDetail.upsert({
        where: {
          resultId_questionId: { resultId, questionId }
        },
        update: { selectedLabel: selectedLabel as OptionLabel },
        create: {
          resultId,
          questionId,
          selectedLabel: selectedLabel as OptionLabel
        }
      });
    });

    await prisma.$transaction(upserts);
    return true;
  },

  // Nộp bài
  submitExam: async (examId: string, resultId: string, userId: string, answers: Record<string, string>, timeTaken: number, tabSwitchCount: number) => {
    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: { exam: { include: { questions: { include: { options: true } } } } }
    });

    if (!result || result.userId !== userId || result.examId !== examId || result.status !== "IN_PROGRESS") {
      throw new ApiError("Bài thi không hợp lệ hoặc đã nộp", StatusCodes.BAD_REQUEST);
    }

    const exam = result.exam;
    if (!exam) throw new ApiError("Không tìm thấy đề thi", StatusCodes.NOT_FOUND);

    // Lấy toàn bộ câu hỏi của đề để chấm điểm
    const allQuestions = await prisma.question.findMany({
      where: { examId: exam.id },
      include: { options: true }
    });

    let correctQ = 0;
    let listeningCorrect = 0;
    let readingCorrect = 0;

    const isListeningPart = (part: string, order: number) => {
      if (part === 'FULL') return order <= 100; // Mặc định TOEIC 100 câu đầu là Nghe
      return ['PART1', 'PART2', 'PART3', 'PART4'].includes(part);
    };

    const detailsData = allQuestions.map(q => {
      const selectedLabel = answers[q.id] as OptionLabel | undefined;
      const correctOption = q.options.find(o => o.isCorrect);
      const isCorrect = selectedLabel === correctOption?.label;

      if (isCorrect) {
        correctQ++;
        if (isListeningPart(exam.part, q.order)) {
          listeningCorrect++;
        } else {
          readingCorrect++;
        }
      }

      return {
        resultId,
        questionId: q.id,
        selectedLabel: selectedLabel || null,
        isCorrect
      };
    });

    // Tính điểm
    const isFullTest = exam.part === 'FULL';
    let totalScore = 0;
    let listeningScore = 0;
    let readingScore = 0;

    if (isFullTest) {
      listeningScore = scoringHelper.getScaledScore('LISTENING', listeningCorrect);
      readingScore = scoringHelper.getScaledScore('READING', readingCorrect);
      totalScore = listeningScore + readingScore;
    } else {
      totalScore = scoringHelper.calculatePartialScore(correctQ);
    }

    // Lưu DB sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu
    const [_, __, finalResult] = await prisma.$transaction([
      // 1. Xóa details cũ (nếu có) để insert lại cho chuẩn
      prisma.resultDetail.deleteMany({ where: { resultId } }),

      // 2. Insert chi tiết đáp án mới
      prisma.resultDetail.createMany({ data: detailsData }),

      // 3. Cập nhật trạng thái bài thi thành COMPLETED
      prisma.result.update({
        where: { id: resultId },
        data: {
          status: "COMPLETED",
          submittedAt: new Date(),
          timeTaken,
          tabSwitchCount,
          totalQ: allQuestions.length,
          correctQ,
          score: totalScore,
          listeningScore: isFullTest ? listeningScore : null,
          readingScore: isFullTest ? readingScore : null,
          listeningCorrect,
          readingCorrect,
          isFullTest
        }
      })
    ]);

    return finalResult;
  }
};
