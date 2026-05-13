import { Request, Response, NextFunction } from 'express';
import { uploadImage, uploadAudio } from '../utils/cloudinary';
import ApiError from '../utils/ApiError';
import { StatusCodes } from 'http-status-codes';

export const uploadMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ApiError('Không có file nào được tải lên', StatusCodes.BAD_REQUEST);
    }

    const isAudio = req.file.mimetype.startsWith('audio/');
    const isImage = req.file.mimetype.startsWith('image/');
    const isVideo = req.file.mimetype.startsWith('video/');

    if (!isAudio && !isImage && !isVideo) {
      throw new ApiError('Định dạng file không hỗ trợ. Chỉ nhận Audio, Video hoặc Image.', StatusCodes.BAD_REQUEST);
    }

    let result;
    if (isAudio || isVideo) {
      result = await uploadAudio(req.file as any, 'toeic_media');
    } else {
      result = await uploadImage(req.file as any, 'toeic_media');
    }

    res.status(StatusCodes.OK).json({ 
      url: result.secure_url,
      publicId: result.public_id 
    });
  } catch (error) {
    next(error);
  }
};
