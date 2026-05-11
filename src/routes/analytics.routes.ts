import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getOverview, getProgress, getTopics } from '../controllers/analyticsController';

const router = Router();

router.use(authenticate);

router.get('/overview', getOverview);

router.get('/progress', getProgress);

router.get('/topics', getTopics);

export default router;
