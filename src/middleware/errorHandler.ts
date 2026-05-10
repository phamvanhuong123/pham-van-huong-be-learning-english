import { Request, Response, NextFunction } from 'express';
// Assuming PrismaClientKnownRequestError will be imported from Prisma later
// For now we will check if the error is a Prisma error by its name or code

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  // Prisma Error Handling
  if (err.name === 'PrismaClientKnownRequestError') {
    // Return friendly message instead of stack trace
    res.status(400).json({
      success: false,
      message: 'Database error occurred. Please check your request data.',
      code: err.code
    });
    return;
  }

  // General Error Handling
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? message : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
