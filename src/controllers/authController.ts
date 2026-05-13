import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenUtils';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validators';
import { env } from '../config/env';
import ApiError from '../utils/ApiError';
import { StatusCodes } from 'http-status-codes';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    await authService.registerUser(validatedData);
    res.status(StatusCodes.CREATED).json({ message: "Vui lòng kiểm tra email để xác thực tài khoản" });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(new ApiError(error.errors[0].message, StatusCodes.BAD_REQUEST));
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const user = await authService.loginUser(validatedData);

    const accessToken = generateAccessToken({ userId: user.id, role: user.role, email: user.email });
    const refreshToken = generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(new ApiError(error.errors[0].message, 400));
    }
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw new ApiError("Refresh token không hợp lệ", StatusCodes.UNAUTHORIZED);
    }

    import('jsonwebtoken').then((jwt) => {
      jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, async (err: any, decoded: any) => {
        if (err) {
          return next(new ApiError("Refresh token không hợp lệ", StatusCodes.UNAUTHORIZED));
        }

        const user = await authService.getUserById(decoded.userId);
        if (!user || user.isBanned) {
          return next(new ApiError("Refresh token không hợp lệ", StatusCodes.UNAUTHORIZED));
        }
        if (user.role === 'VIP' && user.vipExpiresAt && user.vipExpiresAt < new Date()) {
          user.role = 'STANDARD';
          import('../config/database').then((db) => {
            db.default.user.update({ where: { id: user.id }, data: { role: 'STANDARD' } }).catch(console.error);
          });
        }

        const accessToken = generateAccessToken({ userId: user.id, role: user.role, email: user.email });
        res.status(StatusCodes.OK).json({ 
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl
          }
        });
      });
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.status(StatusCodes.OK).json({ message: "Đăng xuất thành công" });
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      throw new ApiError("Token không hợp lệ hoặc đã hết hạn", 400);
    }
    await authService.verifyEmail(token);
    res.status(StatusCodes.OK).json({ message: "Xác thực email thành công" });
  } catch (error) {
    next(error);
  }
};


export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(validatedData.email);
    res.status(StatusCodes.OK).json({ message: "Nếu email tồn tại, một link khôi phục mật khẩu sẽ được gửi đến hộp thư của bạn." });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(new ApiError(error.errors[0].message, StatusCodes.BAD_REQUEST));
    }
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(validatedData);
    res.status(StatusCodes.OK).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return next(new ApiError(error.errors[0].message, StatusCodes.BAD_REQUEST));
    }
    next(error);
  }
};
