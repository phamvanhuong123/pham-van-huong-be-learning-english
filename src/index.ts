import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';

import cookieParser from 'cookie-parser';

const app = express();

app.use(cookieParser());
// 1. Helmet for security headers
app.use(helmet());

// 2. CORS
app.use(cors({
  origin: env.NODE_ENV === 'production' ? env.CLIENT_URL : "http://localhost:5173",
  credentials: true,
}));

// 3. Rate Limiter
// General limit: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Specific limit for auth routes: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Quá nhiều yêu cầu đăng nhập/đăng ký, vui lòng thử lại sau 15 phút.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// Apply strict rate limiting to auth routes specifically
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 4. Body Parser
app.use(express.json());

// 5. Routes
app.use('/api/auth', authRoutes);
// app.use('/api/exam', examRoutes);
// app.use('/api/vocab', vocabRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 6. Error Handler
app.use(errorHandler);

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


