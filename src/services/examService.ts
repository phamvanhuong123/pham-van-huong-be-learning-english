import { prisma } from "@/config/prisma"
import { ExamCreatePayload, ExamUpdatePayload } from "@/types/exam.types"
import ApiError from "@/utils/ApiError"
import { EXAM_SELECT_FIELDS } from "@/utils/contanst"
import { StatusCodes } from "http-status-codes"
import { createAdminLog } from '@/utils/adminLogHelper';

const createExam = async (adminId: string, data: ExamCreatePayload) => {
  return await prisma.$transaction(async (tx) => {
    // Tạo đề
    const exam = await tx.exam.create({
      data: {
        title: data.title,
        description: data.description,
        part: data.part,
        difficulty: data.difficulty,
        duration: data.duration,
        type: data.type,
      }
    })
    //Nếu đề là Full
    if (data.part == 'FULL') {
      if (!data.childrenIdExam || data.childrenIdExam.length === 0) {
        throw new ApiError("Mã đề con không được để trống", StatusCodes.BAD_REQUEST)
      }
      // Cập nhật parentExamId cho các đề con (children)
      const countUpdate = await tx.exam.updateMany({
        where: {
          id: {
            in: data.childrenIdExam
          },
          part: {
            not: 'FULL'
          },
          parentExamId: null
        },
        data: {
          parentExamId: exam.id
        }
      })
      if (countUpdate.count !== data.childrenIdExam.length || countUpdate.count === 0) {
        throw new ApiError("Danh sách đề con chứa mã không hợp lệ (không tồn tại, đã có đề cha hoặc thuộc loại đề FULL).", StatusCodes.BAD_REQUEST)
      }
    }

    await createAdminLog(tx, {
      adminId,
      action: 'exam.create',
      targetType: 'Exam',
      targetId: exam.id,
      detail: { title: exam.title, part: exam.part }
    });

    return exam
  })
}

const getListExam = async () => {
  return await prisma.exam.findMany({
    where: {
      isDeleted: false
    },

    select: EXAM_SELECT_FIELDS
  })
}
const deleteExam = async (adminId: string, id: string) => {
  const exam = await prisma.exam.findFirst({
    where: {
      id: id,
      isDeleted: false
    }
  })
  if (!exam) {
    throw new ApiError("Không tìm thấy bài kiểm tra", StatusCodes.NOT_FOUND)
  }
  return await prisma.$transaction(async (tx) => {
    if (exam.part == 'FULL') {
      await tx.exam.updateMany({
        where: {
          parentExamId: id
        },
        data: {
          parentExamId: null,
          isDeleted: true,
          deletedAt: new Date(),
        }
      })
    }
    const updateCount = await tx.exam.update({
      where: {
        id: id,
        isDeleted: false
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        parentExamId: null
      }
    })

    await createAdminLog(tx, {
      adminId,
      action: 'exam.delete',
      targetType: 'Exam',
      targetId: id,
      detail: { title: exam.title }
    });

    return updateCount
  })

}

const updateExam = async (adminId: string, id: string, data: ExamUpdatePayload) => {
  const existExam = await prisma.exam.findFirst({
    where: { id, isDeleted: false },
    select: { id: true, part: true, title: true }
  })
  if (!existExam) throw new ApiError("Không tìm thấy bài kiểm tra", StatusCodes.NOT_FOUND)

  const { childrenIdExam, ...rest } = data
  const targetPart = rest.part || existExam.part

  return await prisma.$transaction(async (tx) => {
    // 1. Cập nhật Exam hiện tại (Nếu không phải FULL, tự động set parentExamId = null)
    const updatedExam = await tx.exam.update({
      where: { id },
      data: { ...rest, parentExamId: targetPart !== 'FULL' ? null : undefined },
      select: EXAM_SELECT_FIELDS
    })

    // 2. Giải phóng đề con cũ (Chạy khi trước đó là FULL và: đổi sang part thường HOẶC truyền danh sách con mới)
    if (existExam.part === 'FULL' && (childrenIdExam || targetPart !== 'FULL')) {
      await tx.exam.updateMany({ where: { parentExamId: id }, data: { parentExamId: null } })
    }

    // 3. Liên kết các đề con mới (Chạy khi hiện tại là FULL và có mảng childrenIdExam)
    if (targetPart === 'FULL' && childrenIdExam?.length) {
      const updateCount = await tx.exam.updateMany({
        where: { id: { in: childrenIdExam }, isDeleted: false, parentExamId: null, part: { not: 'FULL' } },
        data: { parentExamId: id },

      })
      if (updateCount.count !== childrenIdExam.length) {
        throw new ApiError("Danh sách đề con không hợp lệ.", StatusCodes.BAD_REQUEST)
      }
    }

    await createAdminLog(tx, {
      adminId,
      action: 'exam.update',
      targetType: 'Exam',
      targetId: id,
      detail: { oldTitle: existExam.title, newTitle: updatedExam.title }
    });

    return updatedExam
  })
}

export const examService = {
  createExam,
  getListExam,
  deleteExam,
  updateExam
}