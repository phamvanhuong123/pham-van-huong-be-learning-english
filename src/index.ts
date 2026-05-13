import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import examRoutes from './routes/exam.routes';
import resultRoutes from './routes/result.routes';
import vocabRoutes from './routes/vocab.routes';
import dashboardRoutes from './routes/dashboard.routes';
import profileRoutes from './routes/profile.routes';
import analyticsRoutes from './routes/analytics.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import subscriptionRoutes from './routes/subscription.routes';

import './jobs/sm2Reminder';


import cookieParser from 'cookie-parser';
import { StatusCodes } from 'http-status-codes';

import { createServer } from 'http';
import { initSocket } from './sockets';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

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
   handler: (req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Specific limit for auth routes: 100 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.',
    });
  },
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
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 6. Error Handler
app.use(errorHandler);

const PORT = env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
