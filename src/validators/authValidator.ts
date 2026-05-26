import {Request, Response, NextFunction} from 'express'
import ApiError from '@/utils/ApiError'
import {z, ZodError} from 'zod'
import { StatusCodes } from 'http-status-codes'
const register = async (req : Request, res : Response, next : NextFunction) => {
  const schema = z.object({
    email : z.string().trim().pipe(z.email("Email không hợp lệ")),
    password : z.string().min(8, "Mật khẩu ít nhất là 8 kí tự").regex(/\d/,"Mật khẩu phải chứa ít nhất 1 chữ số").trim(),
    name : z.string().optional() 
  })
  try{
     req.body = await schema.parseAsync(req.body)
     next()
  }
  catch(error : unknown) {

    if(error instanceof ZodError){
      const errorMessages = error.issues.map(e => e.message).join('\n')
      return next(new ApiError(errorMessages,StatusCodes.UNPROCESSABLE_ENTITY))
    }
    next(error)
  }
};

const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  const schema = z.object({
    email: z.string().trim().pipe(z.email("Email không hợp lệ")),
  });
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const errorMessages = error.issues.map(e => e.message).join('\n');
      return next(new ApiError(errorMessages, StatusCodes.UNPROCESSABLE_ENTITY));
    }
    next(error);
  }
};

const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const schema = z.object({
    token: z.string().min(1, "Token là bắt buộc"),
    newPassword: z.string().min(8, "Mật khẩu ít nhất là 8 kí tự").regex(/\d/, "Mật khẩu phải chứa ít nhất 1 chữ số").trim(),
  });
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const errorMessages = error.issues.map(e => e.message).join('\n');
      return next(new ApiError(errorMessages, StatusCodes.UNPROCESSABLE_ENTITY));
    }
    next(error);
  }
};

export const authValidator = {
  register,
  forgotPassword,
  resetPassword,
};
