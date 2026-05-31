import { prisma } from "@/config/prisma";
import ApiError from "@/utils/ApiError";
import { StatusCodes } from "http-status-codes";

const getReviewDetails = async (resultId: string, userId: string) => {
  // 1. Fetch Result to ensure it exists, belongs to user, and is COMPLETED
  const result = await prisma.result.findFirst({
    where: { id: resultId, userId },
    include: {
      resultDetails: true
    }
  });

  if (!result) {
    throw new ApiError("Không tìm thấy kết quả", StatusCodes.NOT_FOUND);
  }
  
  if (result.status !== "COMPLETED") {
    throw new ApiError("Bài thi chưa hoàn thành, không thể xem lại", StatusCodes.BAD_REQUEST);
  }

  // 3. Map answers to questions
  const answerMap = new Map(result.resultDetails.map(rd => [rd.questionId, rd]));

  const mapQuestionWithReview = (q: any, fallbackPart?: string) => {
    const detail = answerMap.get(q.id);
    return {
      id: q.id,
      order: q.order,
      part: q.part || fallbackPart,
      questionText: q.questionText,
      difficulty: q.difficulty,
      explanation: q.explanation,
      options: q.options.map((opt: any) => ({
        id: opt.id,
        label: opt.label,
        text: opt.text,
        isCorrect: opt.isCorrect
      })),
      userAnswer: detail ? {
        selectedLabel: detail.selectedLabel,
        isCorrect: detail.isCorrect
      } : null,
      note: q.notes && q.notes.length > 0 ? q.notes[0].content : null
    };
  };

  const mapPassageGroups = (passageGroups: any[], fallbackPart?: string) => {
    return passageGroups.map(pg => ({
      id: pg.id,
      passages: pg.passages.map((p: any) => ({
        id: p.id,
        content: p.content,
        transcript: p.transcript, // Include transcript in review mode
        mediaUrl: p.mediaUrl,
        mediaType: p.mediaType,
        order: p.order,
      })),
      questions: pg.questions.map((q: any) => mapQuestionWithReview(q, fallbackPart))
    }));
  };

  let examTitle = "Bài tập";
  let examPart = null;
  let examDuration = 0;
  let mappedPassageGroups: any[] = [];
  let mappedStandaloneQuestions: any[] = [];

  if (result.examId) {
    // Fetch Exam with all questions, options, and passage groups
    const exam = await prisma.exam.findUnique({
      where: { id: result.examId },
      include: {
        childExams: {
          include: {
            passageGroups: {
              include: {
                passages: { orderBy: { order: "asc" } },
                questions: {
                  where: { isDeleted: false },
                  orderBy: { order: "asc" },
                  include: { options: true, notes: { where: { userId } } }
                }
              }
            },
            questions: {
              where: { isDeleted: false, passageGroupId: null },
              orderBy: { order: "asc" },
              include: { options: true, notes: { where: { userId } } }
            }
          }
        },
        passageGroups: {
          include: {
            passages: { orderBy: { order: "asc" } },
            questions: {
              where: { isDeleted: false },
              orderBy: { order: "asc" },
              include: { options: true, notes: { where: { userId } } }
            }
          }
        },
        questions: {
          where: { isDeleted: false, passageGroupId: null },
          orderBy: { order: "asc" },
          include: { options: true, notes: { where: { userId } } }
        }
      }
    });

    if (!exam) {
      throw new ApiError("Không tìm thấy đề thi", StatusCodes.NOT_FOUND);
    }

    examTitle = exam.title;
    examPart = exam.part as any;
    examDuration = exam.duration;

    mappedPassageGroups = mapPassageGroups(exam.passageGroups, exam.part);
    mappedStandaloneQuestions = exam.questions.map((q: any) => mapQuestionWithReview(q, exam.part));

    if (exam.childExams && exam.childExams.length > 0) {
      exam.childExams.forEach((child: any) => {
        mappedPassageGroups.push(...mapPassageGroups(child.passageGroups, child.part));
        mappedStandaloneQuestions.push(...child.questions.map((q: any) => mapQuestionWithReview(q, child.part)));
      });
    }
  } else if (result.grammarTopicId) {
    // Fetch Grammar Topic
    const topic = await prisma.grammarTopic.findUnique({
      where: { id: result.grammarTopicId },
      include: {
        questions: {
          where: { isDeleted: false },
          orderBy: { order: "asc" },
          include: {
            options: true,
            notes: { where: { userId } }
          }
        }
      }
    });

    if (!topic) {
      throw new ApiError("Không tìm thấy chủ đề ngữ pháp", StatusCodes.NOT_FOUND);
    }

    examTitle = topic.name;
    mappedStandaloneQuestions = topic.questions.map((q: any) => mapQuestionWithReview(q, "GRAMMAR"));
  } else {
    throw new ApiError("Kết quả không hợp lệ", StatusCodes.BAD_REQUEST);
  }

  return {
    id: result.examId || result.grammarTopicId || "unknown",
    title: examTitle,
    part: examPart,
    duration: examDuration,
    resultSummary: {
      score: result.score,
      totalQ: result.totalQ,
      correctQ: result.correctQ,
      listeningScore: result.listeningScore,
      readingScore: result.readingScore,
      listeningCorrect: result.listeningCorrect,
      readingCorrect: result.readingCorrect,
      timeTaken: result.timeTaken,
      partBreakdown: result.partBreakdown,
      weakPoints: result.weakPoints
    },
    passageGroups: mappedPassageGroups,
    questions: mappedStandaloneQuestions
  };
};

export const reviewService = {
  getReviewDetails
};
