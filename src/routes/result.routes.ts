import { Router } from 'express';
import * as examController from '../controllers/examController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, examController.getResults);
router.get('/:resultId', authenticate, examController.getResultById);

export default router;
