import { prisma } from "@/config/prisma";
import ApiError from "@/utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { EXAM_SELECT_FIELDS } from "@/utils/contanst";

const getResultHistory = async (userId: string, query: any) => {
  const { page = 1, limit = 10 } = query;
  
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);
  
  const whereClause = {
    userId,
    status: "COMPLETED"
  };

  const [results, total] = await prisma.$transaction([
    prisma.result.findMany({
      where: whereClause,
      include: {
        exam: { select: EXAM_SELECT_FIELDS }
      },
      orderBy: { submittedAt: "desc" },
      skip,
      take,
    }),
    prisma.result.count({ where: whereClause })
  ]);

  return {
    data: results,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

const getResultDetail = async (resultId: string, userId: string) => {
  const result = await prisma.result.findFirst({
    where: { id: resultId, userId },
    include: {
      exam: { select: EXAM_SELECT_FIELDS }
    }
  });

  if (!result) {
    throw new ApiError("Không tìm thấy kết quả", StatusCodes.NOT_FOUND);
  }
  
  if (result.status !== "COMPLETED") {
    throw new ApiError("Bài thi chưa hoàn thành", StatusCodes.BAD_REQUEST);
  }

  return result;
};

export const resultService = {
  getResultHistory,
  getResultDetail
};
