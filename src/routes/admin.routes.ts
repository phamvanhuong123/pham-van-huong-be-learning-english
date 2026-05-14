
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import * as adminController from '../controllers/adminController';
import * as adminVocabController from '../controllers/adminVocabController';
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

router.get('/vocab', adminVocabController.getVocabs);
router.post('/vocab', adminVocabController.createVocab);
router.patch('/vocab/:id', adminVocabController.updateVocab);
router.delete('/vocab/:id', adminVocabController.deleteVocab);
router.post('/vocab/bulk-import', upload.single('file'), adminVocabController.bulkImport);


router.get('/users', adminController.getUsers);
router.patch('/users/:userId', adminController.updateUser);

router.get('/subscriptions', adminController.getSubscriptions);
router.patch('/subscriptions/:subId', adminController.updateSubscription);
router.delete('/subscriptions/:subId', adminController.deleteSubscription);


router.get('/questions', adminController.getQuestions);
router.post('/questions', adminController.createQuestion);
router.patch('/questions/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);
router.patch('/questions/:id/restore', adminController.restoreQuestion);
router.delete('/questions/:id/hard', adminController.hardDeleteQuestion);
router.post('/questions/bulk-delete', adminController.bulkDeleteQuestions);
router.post('/questions/bulk-restore', adminController.bulkRestoreQuestions);
router.post('/questions/bulk-hard', adminController.bulkHardDeleteQuestions);

router.get('/exams', adminController.getExams);
router.post('/exams', adminController.createExam);
router.patch('/exams/:id', adminController.updateExam);
router.delete('/exams/:id', adminController.deleteExam);
router.patch('/exams/:id/restore', adminController.restoreExam);
router.delete('/exams/:id/hard', adminController.hardDeleteExam);
router.post('/exams/bulk-delete', adminController.bulkDeleteExams);
router.post('/exams/bulk-restore', adminController.bulkRestoreExams);
router.post('/exams/bulk-hard', adminController.bulkHardDeleteExams);

router.get('/trash', adminController.getDeletedItems);

router.post('/notifications/broadcast', adminController.broadcastNotification);
router.get('/notifications/broadcasts', adminController.getBroadcasts);
router.delete('/notifications/broadcasts/:id', adminController.deleteBroadcast);

router.get('/passage-groups/:examId', adminController.getPassageGroups);
router.post('/passage-groups', adminController.createPassageGroup);
router.patch('/passage-groups/:id', adminController.updatePassageGroup);
router.delete('/passage-groups/:id', adminController.deletePassageGroup);

router.post('/upload', upload.single('file'), uploadController.uploadMedia);


router.get('/grammar-topics', adminController.getGrammarTopics);
router.post('/grammar-topics', adminController.createGrammarTopic);
router.patch('/grammar-topics/:id', adminController.updateGrammarTopic);
router.delete('/grammar-topics/:id', adminController.deleteGrammarTopic);

export default router;
