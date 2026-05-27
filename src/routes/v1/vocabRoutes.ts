import { Router } from 'express';
import { vocabController } from '@/controllers/vocabController';
import { authenticate } from '@/middlewares/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', vocabController.getVocabList);
router.get('/stats', vocabController.getVocabStats);
router.post('/', vocabController.createVocab);
router.get('/:id', vocabController.getVocabById);
router.put('/:id', vocabController.updateVocab);
router.delete('/:id', vocabController.deleteVocab);

export default router;
