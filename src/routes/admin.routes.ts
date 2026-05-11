/**
 * Admin Routes — Phase 6
 * Tất cả routes đều bọc trong authenticate + requireRole('ADMIN')
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import * as adminController from '../controllers/adminController';

const router = Router();

// ─── Middleware áp dụng cho toàn bộ admin routes ───────────────────────────
router.use(authenticate);
router.use(requireRole('ADMIN'));

// ─── Dashboard ─────────────────────────────────────────────────────────────
router.get('/dashboard', adminController.getDashboard);

// ─── Users ─────────────────────────────────────────────────────────────────
router.get('/users', adminController.getUsers);
router.patch('/users/:userId', adminController.updateUser);

// ─── Subscriptions ─────────────────────────────────────────────────────────
router.get('/subscriptions', adminController.getSubscriptions);
router.patch('/subscriptions/:subId', adminController.updateSubscription);

// ─── Questions ─────────────────────────────────────────────────────────────
router.post('/questions', adminController.createQuestion);
router.patch('/questions/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);

// ─── Exams ─────────────────────────────────────────────────────────────────
router.post('/exams', adminController.createExam);
router.patch('/exams/:id', adminController.updateExam);

// ─── Notifications ─────────────────────────────────────────────────────────
router.post('/notifications/broadcast', adminController.broadcastNotification);

export default router;
