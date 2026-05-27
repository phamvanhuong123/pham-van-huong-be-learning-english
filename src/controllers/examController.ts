import { examService } from "@/services/examService";
import { ExamCreatePayload, ExamUpdatePayload } from "@/types/exam.types";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const createExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const examPayload: ExamCreatePayload = req.body
        console.log(examPayload)
        const exam = await examService.createExam(adminId, examPayload)
        res.status(StatusCodes.CREATED).json({
            statusCode: StatusCodes.CREATED,
            message: "Tạo bài kiểm tra thành công",
            data: exam
        })
    } catch (error) {
        next(error)
    }
}

const getListExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const exams = await examService.getListExam()

        res.status(StatusCodes.OK).json({
            statusCode: StatusCodes.OK,
            message: "Lấy danh sách bài kiểm tra thành công",
            data: exams
        })

    }
    catch (error) {
        next(error)
    }
}
const deleteExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const id = req.params.id as string
        const result = await examService.deleteExam(adminId, id)
        res.status(StatusCodes.OK).json({
            statusCode: StatusCodes.OK,
            message: "Xóa bài kiểm tra thành công",
            data: {
                id: result.id,
                isDeleted: result.isDeleted,
                deletedAt: result.deletedAt
            }
        })

    } catch (error) {
        next(error)
    }
}

const updateExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminId = req.user!.id;
        const id = req.params.id as string
        const payload: ExamUpdatePayload = req.body
        const result = await examService.updateExam(adminId, id, payload)
        res.status(StatusCodes.OK).json({
            statusCode: StatusCodes.OK,
            message: "Cập nhật bài kiểm tra thành công",
            data: result
        })
    } catch (error) {
        next(error)
    }
}

export const examController = {
    createExam,
    getListExam,
    deleteExam,
    updateExam
}
