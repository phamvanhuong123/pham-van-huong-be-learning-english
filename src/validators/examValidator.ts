import { Request, Response, NextFunction } from 'express'
import ApiError from '@/utils/ApiError'
import { z, ZodError } from 'zod'
import { StatusCodes } from 'http-status-codes'

const createExam = async (req: Request, res: Response, next: NextFunction) => {
    const schema = z.object({
        title: z.string({ error: 'Tiêu đề là bắt buộc' }).min(3, "Tiêu đề phải có ít nhất 3 ký tự").max(255, "Tiêu đề không được vượt quá 255 ký tự").trim(),
        description: z.string({ error: 'Mô tả không hợp lệ' }).max(1000, "Mô tả không được vượt quá 1000 ký tự").trim().optional(),
        part: z.enum(['PART1', 'PART2', 'PART3', 'PART4', 'PART5', 'PART6', 'PART7', 'FULL'], { error: 'Part bài thi không hợp lệ' }),
        difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], { error: 'Độ khó không hợp lệ' }),
        type: z.enum(['FREE', 'VIP'], { error: 'Loại bài thi không hợp lệ' }),
        duration: z.number({ error: 'Thời gian làm bài là bắt buộc' }).int("Thời gian làm bài phải là số nguyên").positive("Thời gian làm bài phải lớn hơn 0"),
        childrenIdExam: z.array(z.string()).optional()
    })

    try {
        req.body = await schema.parseAsync(req.body)
        next()
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            const errorMessages = error.issues.map(e => e.message).join('\n')
            return next(new ApiError(errorMessages, StatusCodes.UNPROCESSABLE_ENTITY))
        }
        next(error)
    }
}

const updateExam = async (req: Request, res: Response, next: NextFunction) => {
    const schema = z.object({
        title: z.string({ error: 'Tiêu đề không hợp lệ' }).min(3, "Tiêu đề phải có ít nhất 3 ký tự").max(255, "Tiêu đề không được vượt quá 255 ký tự").trim().optional(),
        description: z.string({ error: 'Mô tả không hợp lệ' }).max(1000, "Mô tả không được vượt quá 1000 ký tự").trim().optional(),
        part: z.enum(['PART1', 'PART2', 'PART3', 'PART4', 'PART5', 'PART6', 'PART7', 'FULL'], { error: 'Part bài thi không hợp lệ' }).optional(),
        difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], { error: 'Độ khó không hợp lệ' }).optional(),
        type: z.enum(['FREE', 'VIP'], { error: 'Loại bài thi không hợp lệ' }).optional(),
        duration: z.number({ error: 'Thời gian làm bài không hợp lệ' }).int("Thời gian làm bài phải là số nguyên").positive("Thời gian làm bài phải lớn hơn 0").optional(),
        childrenIdExam: z.array(z.string()).optional(),
        isPublished: z.boolean().optional()
    })

    try {
        req.body = await schema.parseAsync(req.body)
        next()
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            const errorMessages = error.issues.map(e => e.message).join('\n')
            return next(new ApiError(errorMessages, StatusCodes.UNPROCESSABLE_ENTITY))
        }
        next(error)
    }
}

export const examValidator = {
    createExam,
    updateExam
}
