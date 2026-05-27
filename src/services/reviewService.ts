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

  // 2. Fetch Exam with all questions, options, and passage groups (including childExams for FULL test)
  const exam = await prisma.exam.findUnique({
    where: { id: result.examId! },
    include: {
      childExams: {
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
                  options: true,
                  notes: {
                    where: { userId } // fetch user's note for this question
                  }
                }
              }
            }
          },
          questions: {
            where: { isDeleted: false, passageGroupId: null },
            orderBy: { order: "asc" },
            include: {
              options: true,
              notes: {
                where: { userId }
              }
            }
          }
        }
      },
      passageGroups: {
        include: {
          passages: {
            orderBy: { order: "asc" }
          },
          questions: {
            where: { isDeleted: false },
            orderBy: { order: "asc" },
            include: {
              options: true,
              notes: {
                where: { userId } // fetch user's note for this question
              }
            }
          }
        }
      },
      questions: {
        where: { isDeleted: false, passageGroupId: null },
        orderBy: { order: "asc" },
        include: {
          options: true,
          notes: {
            where: { userId }
          }
        }
      }
    }
  });

  if (!exam) {
    throw new ApiError("Không tìm thấy đề thi", StatusCodes.NOT_FOUND);
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

  const mappedPassageGroups = mapPassageGroups(exam.passageGroups, exam.part);
  const mappedStandaloneQuestions = exam.questions.map((q: any) => mapQuestionWithReview(q, exam.part));

  if (exam.childExams && exam.childExams.length > 0) {
    exam.childExams.forEach((child: any) => {
      mappedPassageGroups.push(...mapPassageGroups(child.passageGroups, child.part));
      mappedStandaloneQuestions.push(...child.questions.map((q: any) => mapQuestionWithReview(q, child.part)));
    });
  }


  return {
    id: exam.id,
    title: exam.title,
    part: exam.part,
    duration: exam.duration,
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
