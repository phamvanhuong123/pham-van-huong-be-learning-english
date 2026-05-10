import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenUtils';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validators';
import { env } from '../config/env';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    await authService.registerUser(validatedData);
    res.status(201).json({ message: "Vui lòng kiểm tra email để xác thực tài khoản" });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: error.errors[0].message });
      return;
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
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      res.status(401).json({ message: "Refresh token không hợp lệ" });
      return;
    }

    import('jsonwebtoken').then((jwt) => {
      jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, async (err: any, decoded: any) => {
        if (err) {
          res.status(401).json({ message: "Refresh token không hợp lệ" });
          return;
        }

        const user = await authService.getUserById(decoded.userId);
        if (!user || user.isBanned) {
          res.status(401).json({ message: "Refresh token không hợp lệ" });
          return;
        }

        // Downgrade VIP if expired
        if (user.role === 'VIP' && user.vipExpiresAt && user.vipExpiresAt < new Date()) {
          user.role = 'STANDARD';
          // Tự động update database background
          import('../config/database').then((db) => {
            db.default.user.update({ where: { id: user.id }, data: { role: 'STANDARD' } }).catch(console.error);
          });
        }

        const accessToken = generateAccessToken({ userId: user.id, role: user.role, email: user.email });
        res.status(200).json({ accessToken });
      });
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.status(200).json({ message: "Đăng xuất thành công" });
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
      return;
    }
    await authService.verifyEmail(token);
    res.status(200).json({ message: "Xác thực email thành công" });
  } catch (error) {
    next(error);
  }
};


export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(validatedData.email);
    res.status(200).json({ message: "Nếu email tồn tại, một link khôi phục mật khẩu sẽ được gửi đến hộp thư của bạn." });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(validatedData);
    res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ message: error.errors[0].message });
      return;
    }
    next(error);
  }
};
