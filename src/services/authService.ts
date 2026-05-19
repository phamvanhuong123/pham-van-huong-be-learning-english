
import { env } from "@/config/environment";
import { prisma } from "@/config/prisma";
import { emailService } from "@/services/emailService";
import { LoginPayload, RegisterRequest } from "@/types/auth.type";
import ApiError from "@/utils/ApiError";
import { EmailDeliveryError } from "@/utils/EmailDeliveryError";
import { generateRandomToken, hashToken } from "@/utils/generateRandom";
import { generateToken } from "@/utils/jwtTokenHelper";
import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";

const login = async(data : LoginPayload) => {
    const exsistUser = await prisma.user.findFirst({where : {
      email : data.email,
    }})
    if(!exsistUser)
      throw new ApiError("Email hoặc mật khẩu không hợp lệ",StatusCodes.BAD_REQUEST)
    
    const isValidPassword = await bcrypt.compare(data.password, exsistUser.passwordHash)

    if(!isValidPassword)
      throw new ApiError("Email hoặc mật khẩu không hợp lệ",StatusCodes.BAD_REQUEST)

    if(!exsistUser.emailVerified) 
      throw new ApiError("Email chưa xác thực",StatusCodes.BAD_REQUEST)
    if(!exsistUser.emailVerified) 
      throw new ApiError("Email chưa xác thực",StatusCodes.BAD_REQUEST)
    if(exsistUser.isBanned)
      throw new ApiError("Tài khoản của bạn đã bị khoá",StatusCodes.BAD_REQUEST)

    const userInfo = {
      email : exsistUser.email,
      name : exsistUser.name,
      avatarUrl : exsistUser.avatarUrl,
      id : exsistUser.id,
      role : exsistUser.isSuperAdmin ? "superAdmin" : "user"
    }

    const refreshToken = generateToken(userInfo,env.REFRESH_TOKEN_SECRET_SIGNATURE!,'1 day')
    const accessToken = generateToken(userInfo,env.ACCESS_TOKEN_SECRET_SIGNATURE!,'1h')

    return {refreshToken,accessToken,userInfo}

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
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      verificationToken: hashedToken,
      verificationExpiry: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 giờ
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
    // Luôn luôn xóa user nếu gửi email thất bại, bất kể là lỗi gì
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

export const authService = {
  register,
  verifyEmail,
  login
};
