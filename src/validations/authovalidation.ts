import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/ApiError';

const register = async (req: Request, res: Response, next: NextFunction) => {
  const schema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").regex(/\d/, "Mật khẩu phải chứa ít nhất 1 chữ số"),
    name: z.string().optional(),
  });

  try {
    await schema.parseAsync(req.body);
    next();
  } catch (error: any) {
    // Lấy message lỗi đầu tiên từ Zod
    const errorMessage = error.errors ? error.errors[0].message : error.message;
    // Sử dụng ApiError với message trước, statusCode sau (theo class ApiError bạn đã tạo)
    const customError = new ApiError(errorMessage, StatusCodes.UNPROCESSABLE_ENTITY);
    next(customError);
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  const schema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(1, "Vui lòng nhập mật khẩu"),
  });

  try {
    await schema.parseAsync(req.body);
    next();
  } catch (error: any) {
    const errorMessage = error.errors ? error.errors[0].message : error.message;
    next(new ApiError(errorMessage, StatusCodes.UNPROCESSABLE_ENTITY));
  }
};

const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  const schema = z.object({
    email: z.string().email("Email không hợp lệ"),
  });

  try {
    await schema.parseAsync(req.body);
    next();
  } catch (error: any) {
    const errorMessage = error.errors ? error.errors[0].message : error.message;
    next(new ApiError(errorMessage, StatusCodes.UNPROCESSABLE_ENTITY));
  }
};

const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const schema = z.object({
    token: z.string().min(1, "Token không hợp lệ"),
    newPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").regex(/\d/, "Mật khẩu phải chứa ít nhất 1 chữ số"),
  });

  try {
    await schema.parseAsync(req.body);
    next();
  } catch (error: any) {
    const errorMessage = error.errors ? error.errors[0].message : error.message;
    next(new ApiError(errorMessage, StatusCodes.UNPROCESSABLE_ENTITY));
  }
};

export const authValidation = {
  register,
  login,
  forgotPassword,
  resetPassword
};
