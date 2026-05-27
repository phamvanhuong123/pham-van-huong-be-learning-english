
import { env } from "@/config/environment";
import { prisma } from "@/config/prisma";
import { emailService } from "@/services/emailService";
import { LoginPayload, RegisterRequest } from "@/types/auth.type";
import ApiError from "@/utils/ApiError";
import { EmailDeliveryError } from "@/utils/EmailDeliveryError";
import { generateRandomToken, hashToken } from "@/utils/generateRandom";
import { generateToken, verifyToken } from "@/utils/jwtTokenHelper";
import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";

const login = async (data: LoginPayload, ipAddress?: string, userAgent?: string) => {
  const exsistUser = await prisma.user.findFirst({
    where: {
      email: data.email,
    },
    include: {
      userRoles: {
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } }
            }
          }
        }
      }
    }
  });

  if (!exsistUser)
    throw new ApiError("Email hoặc mật khẩu không hợp lệ", StatusCodes.BAD_REQUEST)

  const isValidPassword = await bcrypt.compare(data.password, exsistUser.passwordHash)

  if (!isValidPassword)
    throw new ApiError("Email hoặc mật khẩu không hợp lệ", StatusCodes.BAD_REQUEST)

  if (!exsistUser.emailVerified)
    throw new ApiError("Email chưa xác thực", StatusCodes.BAD_REQUEST)
  if (exsistUser.isBanned)
    throw new ApiError("Tài khoản của bạn đã bị khoá", StatusCodes.BAD_REQUEST)
  if (exsistUser.isDeleted)
    throw new ApiError("Tài khoản này đã bị xóa", StatusCodes.BAD_REQUEST)

  const permissions = exsistUser.userRoles.flatMap(ur =>
    ur.role.rolePermissions.map(rp => rp.permission.code)
  );

  const isStaff = exsistUser.isSuperAdmin || permissions.length > 0;
  const isVipUser = !!exsistUser.vipExpiresAt && new Date(exsistUser.vipExpiresAt) > new Date();

  const userInfo = {
    email: exsistUser.email,
    name: exsistUser.name,
    avatarUrl: exsistUser.avatarUrl,
    id: exsistUser.id,
    role: exsistUser.isSuperAdmin ? "superAdmin" : "user",
    isSuperAdmin: exsistUser.isSuperAdmin,
    isVip: isStaff || isVipUser,
    permissions
  }

  const refreshToken = generateToken(userInfo, env.REFRESH_TOKEN_SECRET_SIGNATURE!, '1 day')
  const accessToken = generateToken(userInfo, env.ACCESS_TOKEN_SECRET_SIGNATURE!, '1h')

  const session = await prisma.userSession.create({
    data: {
      userId: exsistUser.id,
      ipAddress,
      deviceInfo: userAgent,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
    }
  });

  return { refreshToken, accessToken, userInfo, sessionId: session.id }

}


const register = async (data: RegisterRequest) => {
  const existUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existUser) {
    if (existUser.emailVerified) {
      throw new ApiError("Email đã được sử dụng", StatusCodes.CONFLICT);
    }
    await prisma.user.delete({
      where: {
        email: data.email,
      },
    });
  }
  const passwordHash = await bcrypt.hash(data.password, 10);
  const { hashedToken, token } = generateRandomToken();
  const standardRole = await prisma.role.findUnique({ where: { name: 'STANDARD' } });

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      verificationToken: hashedToken,
      verificationExpiry: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 giờ
      userRoles: standardRole ? {
        create: {
          roleId: standardRole.id
        }
      } : undefined
    },
  });
  try {
    await emailService.sendVerificationEmail(
      user.email,
      user.name || "Bạn",
      token,
    );
    return user.email;
  } catch (err) {
    await prisma.user
      .delete({ where: { id: user.id } })
      .catch((cleanupError) => {
        console.error(
          `Cảnh báo: Không thể xóa user ${user.id} sau khi gửi email lỗi`,
          cleanupError,
        );
      });

    if (err instanceof EmailDeliveryError) {
      throw new ApiError(
        "Không thể gửi email xác thực. Vui lòng thử lại sau.",
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }
    throw new ApiError(
      "Có lỗi xảy ra trong quá trình đăng ký. Xin thử lại.",
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
const verifyEmail = async (token: string) => {
  const hashedToken = hashToken(token);
  const existUser = await prisma.user.findFirst({
    where: {
      verificationToken: hashedToken,
      verificationExpiry: { gt: new Date() },
    },
  });

  if (!existUser) {
    throw new ApiError(
      "Token không hợp lệ hoặc đã hết hạn",
      StatusCodes.BAD_REQUEST,
    );
  }

  await prisma.user.update({
    where: {
      id: existUser.id,
    },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationExpiry: null,
    },
  });

  return true;
};

const refreshToken = async (token: string) => {
  try {
    const decoded = verifyToken(token, env.REFRESH_TOKEN_SECRET_SIGNATURE!) as any;

    // Check real VIP status from DB
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    const isStaff = user?.isSuperAdmin || (decoded.permissions && decoded.permissions.length > 0);
    const isVipUser = user ? (!!user.vipExpiresAt && new Date(user.vipExpiresAt) > new Date()) : false;

    const userInfo = {
      email: decoded.email,
      name: decoded.name,
      avatarUrl: decoded.avatarUrl,
      id: decoded.id,
      role: decoded.role,
      isSuperAdmin: decoded.isSuperAdmin,
      isVip: isStaff || isVipUser,
      permissions: decoded.permissions || []
    };
    const newAccessToken = generateToken(userInfo, env.ACCESS_TOKEN_SECRET_SIGNATURE!, '1h');
    return newAccessToken;
  } catch (error) {
    throw new ApiError("Token không hợp lệ hoặc đã hết hạn", StatusCodes.UNAUTHORIZED);
  }
};

const logout = async (sessionId?: string) => {
  if (sessionId) {
    await prisma.userSession.updateMany({
      where: { id: sessionId },
      data: { isActive: false }
    });
  }
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return silently to prevent email enumeration
    return;
  }

  if (!user.emailVerified) {
    throw new ApiError("Email chưa được xác thực", StatusCodes.BAD_REQUEST);
  }

  const { hashedToken, token } = generateRandomToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
    }
  });

  await emailService.sendPasswordResetEmail(user.email, user.name || "Bạn", token);
};

const resetPassword = async (token: string, newPassword: string) => {
  const hashedToken = hashToken(token);
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { gt: new Date() }
    }
  });

  if (!user) {
    throw new ApiError("Token không hợp lệ hoặc đã hết hạn", StatusCodes.BAD_REQUEST);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password and revoke all sessions
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiry: null
      }
    }),
    prisma.userSession.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false }
    })
  ]);
};

export const authService = {
  register,
  verifyEmail,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
};
