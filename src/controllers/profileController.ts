import { Request, Response, NextFunction } from 'express';
import { profileService } from '@/services/profileService';
import { StatusCodes } from 'http-status-codes';
import { uploadToCloudinary } from '@/config/cloudinary';
import ApiError from '@/utils/ApiError';

export const profileController = {
  getProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await profileService.getProfile(req.user!.id);
      res.status(StatusCodes.OK).json({ data: profile });
    } catch (error) {
      next(error);
    }
  },

  updateProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, targetScore, examDate } = req.body;
      const updated = await profileService.updateProfile(req.user!.id, { name, targetScore, examDate });
      res.status(StatusCodes.OK).json({ message: 'Cập nhật thành công', data: updated });
    } catch (error) {
      next(error);
    }
  },

  uploadAvatar: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) throw new ApiError('Chưa chọn ảnh tải lên', StatusCodes.BAD_REQUEST);

      const result = await uploadToCloudinary(file.buffer, 'toeic/images', 'image');
      const newAvatarUrl = result.url;

      const avatarUrl = await profileService.uploadAvatar(req.user!.id, newAvatarUrl);
      res.status(StatusCodes.OK).json({ message: 'Tải ảnh đại diện thành công', avatarUrl });
    } catch (error) {
      next(error);
    }
  },

  changePassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      if (newPassword !== confirmPassword) {
        throw new ApiError('Mật khẩu xác nhận không khớp', StatusCodes.BAD_REQUEST);
      }
      if (newPassword.length < 6) {
        throw new ApiError('Mật khẩu mới phải có ít nhất 6 ký tự', StatusCodes.BAD_REQUEST);
      }

      await profileService.changePassword(req.user!.id, currentPassword, newPassword);

      res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: 'none' });
      res.clearCookie("sessionId", { httpOnly: true, secure: true, sameSite: 'none' });

      res.status(StatusCodes.OK).json({ message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
    } catch (error) {
      next(error);
    }
  },

  getStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await profileService.getStats(req.user!.id);
      res.status(StatusCodes.OK).json({ data: stats });
    } catch (error) {
      next(error);
    }
  },

  deleteAccount: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { password } = req.body;
      if (!password) throw new ApiError('Vui lòng nhập mật khẩu để xác nhận', StatusCodes.BAD_REQUEST);

      await profileService.deleteAccount(req.user!.id, password);

      res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: 'none' });
      res.clearCookie("sessionId", { httpOnly: true, secure: true, sameSite: 'none' });

      res.status(StatusCodes.OK).json({ message: 'Đã xóa tài khoản thành công.' });
    } catch (error) {
      next(error);
    }
  }
};
