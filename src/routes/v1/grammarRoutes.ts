import { Router } from 'express';
import { grammarController } from '@/controllers/grammarController';
import { authenticate } from '@/middlewares/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', grammarController.getClientTopics);
router.post('/:slug/start', grammarController.startPracticeSession);
router.post('/session/:sessionId/answer', grammarController.submitAnswer);
router.post('/session/:sessionId/end', grammarController.endPracticeSession);

export default router;
