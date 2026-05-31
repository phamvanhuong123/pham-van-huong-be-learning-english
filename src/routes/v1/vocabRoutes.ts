import { Router } from 'express';
import { vocabController } from '@/controllers/vocabController';
import { authenticate } from '@/middlewares/authenticate';

import { uploadCsv, uploadSingleMedia } from '@/middlewares/uploadMiddleware';

const router = Router();

router.use(authenticate);

// SRS Routes (Anki Algorithm)
router.get('/srs/dashboard-stats', vocabController.getDashboardStatsSrs);
router.get('/srs/study-session', vocabController.getStudySessionSrs);
router.post('/srs/:vocabId/review', vocabController.submitReviewSrs);

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
