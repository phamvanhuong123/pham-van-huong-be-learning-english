
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import * as adminController from '../controllers/adminController';
import * as uploadController from '../controllers/uploadController';
import multer from 'multer';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

router.get('/dashboard', adminController.getDashboard);


router.get('/users', adminController.getUsers);
router.patch('/users/:userId', adminController.updateUser);

router.get('/subscriptions', adminController.getSubscriptions);
router.patch('/subscriptions/:subId', adminController.updateSubscription);
router.delete('/subscriptions/:subId', adminController.deleteSubscription);


router.get('/questions', adminController.getQuestions);
router.post('/questions', adminController.createQuestion);
router.patch('/questions/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);

router.get('/exams', adminController.getExams);
router.post('/exams', adminController.createExam);
router.patch('/exams/:id', adminController.updateExam);

router.post('/notifications/broadcast', adminController.broadcastNotification);
router.get('/notifications/broadcasts', adminController.getBroadcasts);
router.delete('/notifications/broadcasts/:id', adminController.deleteBroadcast);

// ─── Passage Groups ────────────────────────────────────────────────────────
router.get('/passage-groups/:examId', adminController.getPassageGroups);
router.post('/passage-groups', adminController.createPassageGroup);
router.patch('/passage-groups/:id', adminController.updatePassageGroup);
router.delete('/passage-groups/:id', adminController.deletePassageGroup);

// ─── Upload Media ─────────────────────────────────────────────────────────
router.post('/upload', upload.single('file'), uploadController.uploadMedia);

export default router;
