import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

export const generateAccessToken = (payload: { userId: string, role: string, email: string }) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const generateRandomToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hashedToken };
};

export const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
