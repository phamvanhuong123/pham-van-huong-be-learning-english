import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';

// Limit register endpoints: 3 requests per IP per 24 hours
export const registerRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Limit each IP to 3 requests per `window` (here, per 24 hours)
  message: {
    statusCode: StatusCodes.TOO_MANY_REQUESTS,
    message: 'Quá 3 tài khoản đăng ký từ IP này trong 24 giờ. Vui lòng thử lại sau.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
