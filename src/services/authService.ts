import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import { generateRandomToken, hashToken } from '../utils/tokenUtils';

export const registerUser = async (data: any) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw { statusCode: 409, message: "Email đã được sử dụng" };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const { token, hashedToken } = generateRandomToken();

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      verificationToken: hashedToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }
  });

  // Mock sending email
  console.log(`[Email Service] Gửi email xác thực tới ${user.email}. Link: /api/auth/verify-email?token=${token}`);
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
    throw { statusCode: 400, message: "Token không hợp lệ hoặc đã hết hạn" };
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
    throw { statusCode: 401, message: "Email hoặc mật khẩu không đúng" };
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw { statusCode: 401, message: "Email hoặc mật khẩu không đúng" };
  }

  if (user.isBanned) {
    throw { statusCode: 403, message: "Tài khoản đã bị khóa" };
  }

  if (!user.emailVerified) {
    throw { statusCode: 403, message: "Tài khoản chưa xác thực email" };
  }

  return user;
};

export const getUserById = async (userId: string) => {
  return prisma.user.findUnique({ where: { id: userId } });
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const { token, hashedToken } = generateRandomToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordTokenExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      }
    });
    // Mock sending email
    console.log(`[Email Service] Gửi email đặt lại mật khẩu tới ${email}. Token: ${token}`);
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
    throw { statusCode: 400, message: "Token không hợp lệ hoặc đã hết hạn" };
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

  return true;
};
