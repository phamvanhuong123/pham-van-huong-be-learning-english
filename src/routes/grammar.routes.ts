import { Router } from 'express';
import * as grammarController from '../controllers/grammarController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Các route này yêu cầu đăng nhập để theo dõi tiến độ (tương lai)
router.use(authenticate);

router.get('/topics', grammarController.getTopics);
router.get('/practice/:slug', grammarController.getPractice);

export default router;
