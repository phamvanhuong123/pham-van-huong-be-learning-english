import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { env } from '@/config/environment';
// Assuming PrismaClientKnownRequestError will be imported from Prisma later
// For now we will check if the error is a Prisma error by its name or code

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // console.error(err);

  // Prisma Error Handling
  if (err.name === 'PrismaClientKnownRequestError') {
    // Return friendly message instead of stack trace
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Database error occurred. Please check your request data.',
      code: err.code
    });
    return;
  }

  // Zod Validation Error Handling
  if (err.name === 'ZodError') {
    res.status(StatusCodes.BAD_REQUEST).json({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Validation failed',
      errors: err.errors
    });
    return;
  }

  // General Error Handling
  if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR

  const responseError = {
    statusCode: err.statusCode,
    message: err.message || StatusCodes[err.statusCode],
    stack: err.stack
  }
  if (env.BUILD_MODE !== 'dev') delete responseError.stack

  // Vô hiệu hóa cache cho tất cả các response lỗi
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.status(err.statusCode).json(responseError);
};
