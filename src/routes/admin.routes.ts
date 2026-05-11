
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import * as adminController from '../controllers/adminController';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

router.get('/dashboard', adminController.getDashboard);


router.get('/users', adminController.getUsers);
router.patch('/users/:userId', adminController.updateUser);

router.get('/subscriptions', adminController.getSubscriptions);
router.patch('/subscriptions/:subId', adminController.updateSubscription);


router.post('/questions', adminController.createQuestion);
router.patch('/questions/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);

router.post('/exams', adminController.createExam);
router.patch('/exams/:id', adminController.updateExam);


router.post('/notifications/broadcast', adminController.broadcastNotification);

export default router;
