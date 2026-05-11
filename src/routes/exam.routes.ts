import { Router } from 'express';
import * as examController from '../controllers/examController';
import { authenticate } from '../middleware/auth';

const router = Router();


router.get('/', authenticate, examController.getExams);

router.get('/:examId', authenticate, examController.getExamById);

router.post('/:examId/submit', authenticate, examController.submitExam);

export default router;
