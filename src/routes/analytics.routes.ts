import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getOverview, getProgress, getTopics } from '../controllers/analyticsController';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// GET /api/analytics/overview
router.get('/overview', getOverview);

// GET /api/analytics/progress?weeks=8
router.get('/progress', getProgress);

// GET /api/analytics/topics  — VIP/ADMIN guard handled in controller
router.get('/topics', getTopics);

export default router;
