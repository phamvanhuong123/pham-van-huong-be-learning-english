import { Router } from 'express';
import { subscriptionController } from '@/controllers/subscriptionController';
import { authenticate } from '@/middlewares/authenticate';
import { uploadSingleMedia } from '@/middlewares/uploadMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', uploadSingleMedia, subscriptionController.createSubscription);
router.get('/mine', subscriptionController.getMySubscriptions);

export default router;
