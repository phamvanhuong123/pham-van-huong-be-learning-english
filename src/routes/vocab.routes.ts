import { Router } from 'express';
import * as vocabController from '../controllers/vocabController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, vocabController.addVocab);

export default router;
