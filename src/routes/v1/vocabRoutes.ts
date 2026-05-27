import { Router } from 'express';
import { vocabController } from '@/controllers/vocabController';
import { authenticate } from '@/middlewares/authenticate';

import { vocabFlashcardController } from '@/controllers/vocabFlashcardController';
import { uploadCsv, uploadSingleMedia } from '@/middlewares/uploadMiddleware';

const router = Router();

router.use(authenticate);

// Flashcard routes
router.get('/flashcard/today', vocabFlashcardController.getTodayCards);
router.post('/flashcard/session', vocabFlashcardController.startSession);
router.post('/flashcard/:vocabId/review', vocabFlashcardController.reviewCard);
router.put('/flashcard/session/:sessionId/end', vocabFlashcardController.endSession);

// CSV Routes
router.post('/import', uploadCsv, vocabController.importCsv);
router.get('/export', vocabController.exportCsv);

// CRUD routes
router.get('/', vocabController.getVocabList);
router.get('/stats', vocabController.getVocabStats);
router.post('/', uploadSingleMedia, vocabController.createVocab);
router.get('/:id', vocabController.getVocabById);
router.put('/:id', uploadSingleMedia, vocabController.updateVocab);
router.delete('/:id', vocabController.deleteVocab);

export default router;
