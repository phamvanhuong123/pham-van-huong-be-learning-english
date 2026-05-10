import { Router } from 'express';
import * as vocabController from '../controllers/vocabController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All vocab routes require authentication
router.use(authenticate);

// ─── Static routes MUST come before dynamic /:vocabId routes ─────────────────

// GET  /api/vocab           → list vocab with filters + pagination
router.get('/', vocabController.getVocabs);

// POST /api/vocab           → add single vocab (text-selection)
router.post('/', vocabController.addVocab);

// GET  /api/vocab/due       → flashcard due queue
router.get('/due', vocabController.getDueVocabs);

// POST /api/vocab/bulk-import
router.post('/bulk-import', vocabController.bulkImportVocab);

// DELETE /api/vocab/bulk    → bulk delete by ids[]
router.delete('/bulk', vocabController.bulkDeleteVocab);

// ─── Dynamic routes ───────────────────────────────────────────────────────────

// PATCH  /api/vocab/:vocabId  → update meaning / topic
router.patch('/:vocabId', vocabController.updateVocab);

// DELETE /api/vocab/:vocabId  → delete single vocab
router.delete('/:vocabId', vocabController.deleteVocab);

// POST /api/vocab/:vocabId/review  → SM-2 review with rating
router.post('/:vocabId/review', vocabController.reviewVocab);

export default router;
