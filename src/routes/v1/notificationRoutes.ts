import express from 'express';
import { notificationController } from '@/controllers/notificationController';
import { authenticate } from '@/middlewares/authenticate'

const router = express.Router();

router.use(authenticate);

router.get('/my-notifications', notificationController.getMyNotifications);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

export default router;
