import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profileService';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/ApiError';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const profile = await profileService.getProfile(userId);
    res.status(StatusCodes.OK).json(profile);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const updatedProfile = await profileService.updateProfile(userId, req.body);
    res.status(StatusCodes.OK).json(updatedProfile);
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const file = req.file;

    if (!file) {
      throw new ApiError('No file uploaded', StatusCodes.BAD_REQUEST);
    }

    const result = await profileService.updateAvatar(userId, file);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};
