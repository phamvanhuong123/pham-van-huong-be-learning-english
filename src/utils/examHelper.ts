import { prisma } from "@/config/prisma";
import ApiError from "@/utils/ApiError";
import { StatusCodes } from "http-status-codes";

/**
 * Lấy exam còn hoạt động và part của nó.
 * Throw 404 nếu không tồn tại hoặc đã bị xóa.
 * Dùng chung cho bất kỳ service nào cần xác thực exam.
 */
export const getActiveExam = async (examId: string) => {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, isDeleted: false },
    select: { id: true, part: true },
  });
  if (!exam) throw new ApiError("Không tìm thấy đề thi", StatusCodes.NOT_FOUND);
  return exam;
};
