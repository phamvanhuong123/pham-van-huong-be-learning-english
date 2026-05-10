import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import { generateRandomToken, hashToken } from '../utils/tokenUtils';
import ApiError from '../utils/ApiError';
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendPasswordChangedEmail,
  EmailDeliveryError,
} from './emailService';

export const registerUser = async (data: any) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new ApiError("Email đã được sử dụng", 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const { token, hashedToken } = generateRandomToken();

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      verificationToken: hashedToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 giờ
    }
  });

  // Gửi email xác thực (token gốc, chưa hash)
  // Nếu gửi thất bại → rollback user để tránh tồn tại tài khoản không xác thực được
  try {
    await sendVerificationEmail({
      to: user.email,
      name: user.name ?? user.email,
      token,
    });
  } catch (err) {
    if (err instanceof EmailDeliveryError) {
      await prisma.user.delete({ where: { id: user.id } });
      throw new ApiError("Không thể gửi email xác thực. Vui lòng thử lại sau.", 503);
    }
    throw err;
  }

  return user;
};

export const verifyEmail = async (token: string) => {
  const hashedToken = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: hashedToken,
      verificationTokenExpires: { gt: new Date() }
    }
  });

  if (!user) {
    throw new ApiError("Token không hợp lệ hoặc đã hết hạn", 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null
    }
  });
  return true;
};

export const loginUser = async (data: any) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new ApiError("Email hoặc mật khẩu không đúng", 401);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError("Email hoặc mật khẩu không đúng", 401);
  }

  if (user.isBanned) {
    throw new ApiError("Tài khoản đã bị khóa", 403);
  }

  if (!user.emailVerified) {
    throw new ApiError("Tài khoản chưa xác thực email", 403);
  }

  return user;
};

export const getUserById = async (userId: string) => {
  return prisma.user.findUnique({ where: { id: userId } });
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Luôn trả về true dù email có tồn tại hay không (tránh user enumeration attack)
  if (user) {
    const { token, hashedToken } = generateRandomToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordTokenExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 giờ
      }
    });

    // Gửi email đặt lại mật khẩu (token gốc, chưa hash)
    await sendResetPasswordEmail({
      to: user.email,
      name: user.name ?? user.email,
      token,
    });
  }

  return true;
};

export const resetPassword = async (data: any) => {
  const hashedToken = hashToken(data.token);
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpires: { gt: new Date() }
    }
  });

  if (!user) {
    throw new ApiError("Token không hợp lệ hoặc đã hết hạn", 400);
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordTokenExpires: null
    }
  });

  // Gửi email thông báo đổi mật khẩu thành công
  await sendPasswordChangedEmail({
    to: user.email,
    name: user.name ?? user.email,
  });

  return true;
};
