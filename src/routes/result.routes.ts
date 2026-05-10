import { Router } from 'express';
import * as examController from '../controllers/examController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/results/:resultId - Get specific exam result details
router.get('/:resultId', authenticate, examController.getResultById);

export default router;
