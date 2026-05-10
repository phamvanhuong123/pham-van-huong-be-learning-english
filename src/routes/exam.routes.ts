import { Router } from 'express';
import * as examController from '../controllers/examController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/exams - Get list of exams with pagination & filters
router.get('/', authenticate, examController.getExams);

// GET /api/exams/:examId - Get a specific exam to take
router.get('/:examId', authenticate, examController.getExamById);

// POST /api/exams/:examId/submit - Submit exam answers
router.post('/:examId/submit', authenticate, examController.submitExam);

export default router;
