
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getNotifications, markAllAsRead } from '../controllers/notificationController';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.post('/read-all', markAllAsRead);

export default router;
