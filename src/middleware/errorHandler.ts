import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
// Assuming PrismaClientKnownRequestError will be imported from Prisma later
// For now we will check if the error is a Prisma error by its name or code

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  // Prisma Error Handling
  if (err.name === 'PrismaClientKnownRequestError') {
    // Return friendly message instead of stack trace
    res.status(StatusCodes.BAD_REQUEST).json({

      message: 'Database error occurred. Please check your request data.',
      code: err.code
    });
    return;
  }

  // General Error Handling
  if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR

  const responseError = {
    statusCode : err.statusCode,
    message: err.message || StatusCodes[err.statusCode],
    stack :err.stack
  }
  if(process.env.NODE_ENV !== 'development') delete responseError.stack

  res.status(err.statusCode).json(responseError);
};
