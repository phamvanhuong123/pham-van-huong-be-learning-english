import { authService } from '@/services/authService';
import { LoginPayload, RegisterRequest } from '@/types/auth.type';
import ApiError from '@/utils/ApiError';
import {NextFunction, Request,Response} from 'express'
import { StatusCodes } from 'http-status-codes';
import ms from 'ms';


const login = async (req : Request, res :  Response,next : NextFunction) => {
  try{
    const loginPlayload : LoginPayload = req.body
    const data = await authService.login(loginPlayload)
    
    res.cookie("refreshToken",data.refreshToken, {
      httpOnly : true,
      secure : true,
      sameSite : 'none',
      maxAge : ms('1 day')
    })
    res.status(StatusCodes.OK).json({
      user : data.userInfo,
      accessToken : data.accessToken
    })
  }
  catch(error){
    next(error)
  }

}


const register = async (req: Request, res: Response,next : NextFunction) => {
  try{
    const registerRequest : RegisterRequest = req.body
    const email = await authService.register(registerRequest)
    res.status(StatusCodes.OK).json({
      statusCode : StatusCodes.OK,
      message : `Chúng tôi đã gửi link xác thực tới ${email} vui lòng kiểm tra`
    })
  }
  catch(error){
    next(error)
  }
};

const verifyEmail = async(req : Request, res : Response, next : NextFunction) => {
  try{
    const {token} = req.query
    if (!token || typeof token !== 'string') {throw new ApiError("Token chưa được gửi lên",StatusCodes.BAD_REQUEST)}
    await authService.verifyEmail(token)
    res.status(StatusCodes.OK).json({
      statusCode : StatusCodes.OK,
      message : "Xác thực thành công"
    })
  }
  catch(error){
    next(error)
  }
}
const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw new ApiError("Refresh token không tồn tại", StatusCodes.UNAUTHORIZED);
    }
    
    const accessToken = await authService.refreshToken(token);
    res.status(StatusCodes.OK).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
    res.status(StatusCodes.OK).json({ message: "Đăng xuất thành công" });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout
};
