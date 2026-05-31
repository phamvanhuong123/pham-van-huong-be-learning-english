import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { adminDashboardController } from '@/controllers/adminDashboardController';
import { adminUserController } from '@/controllers/adminUserController';
import { adminNotificationController } from '@/controllers/adminNotificationController';
import { adminRoleController } from '@/controllers/adminRoleController';
import { adminLogController } from '@/controllers/adminLogController';
import { adminTrashController } from '@/controllers/adminTrashController';

const route = Router();

// Tất cả admin routes đều cần authenticate
route.use(authenticate);

// ─── Dashboard ──────────────────────────────────────────────────
route.get('/dashboard/stats', authorize('analytics.view_all'), adminDashboardController.getStats);

// ─── Users ──────────────────────────────────────────────────────
route.get('/users', authorize('user.view'), adminUserController.getUsers);
route.get('/users/:id', authorize('user.view'), adminUserController.getUserById);
route.patch('/users/:id/ban', authorize('user.ban'), adminUserController.banUser);
route.patch('/users/:id/role', authorize('user.manage'), adminUserController.updateRole);
route.post('/users/:id/reset-password', authorize('user.manage'), adminUserController.resetPassword);
route.delete('/users/:id/sessions', authorize('user.manage'), adminUserController.kickAllSessions);

// ─── Results ────────────────────────────────────────────────────
import { adminResultController } from '@/controllers/adminResultController';
route.get('/users/:id/results', authorize('user.view'), adminResultController.getUserResults);
route.get('/results/:id', authorize('user.view'), adminResultController.getResultDetails);

// ─── Notifications ──────────────────────────────────────────────
route.get('/notifications', authorize('notification.view'), adminNotificationController.getBroadcasts);
route.post('/notifications/broadcast', authorize('notification.broadcast'), adminNotificationController.broadcast);

// ─── Roles (SUPER_ADMIN only via system config or role.manage) ───
route.get('/roles', authorize('role.manage'), adminRoleController.getRoles);
route.post('/roles', authorize('role.manage'), adminRoleController.createRole);
route.patch('/roles/:id', authorize('role.manage'), adminRoleController.updateRole);
route.delete('/roles/:id', authorize('role.manage'), adminRoleController.deleteRole);
route.get('/roles/permissions', authorize('role.manage'), adminRoleController.getPermissions);
route.get('/roles/:id/permissions', authorize('role.manage'), adminRoleController.getRolePermissions);
route.put('/roles/:id/permissions', authorize('role.manage'), adminRoleController.updateRolePermissions);

// ─── Logs ───────────────────────────────────────────────────────
route.get('/logs', authorize('admin.log.view'), adminLogController.getLogs);

// ─── Trash ──────────────────────────────────────────────────────
route.get('/trash', authorize('trash.view'), adminTrashController.getTrash);
route.patch('/trash/:type/:id/restore', authorize('trash.restore'), adminTrashController.restore);
// Hard delete thường chỉ dành cho SuperAdmin, tạm dùng trash.manage nếu có, hoặc để authorize('system.manage')
route.delete('/trash/:type/:id', authorize('trash.restore'), adminTrashController.hardDelete);

// ─── System Vocab ──────────────────────────────────────────────
import { adminVocabController } from '@/controllers/adminVocabController';
import { uploadCsv } from '@/middlewares/uploadMiddleware';

route.get('/vocab', authorize('system.manage'), adminVocabController.getSystemVocabs);
route.post('/vocab', authorize('system.manage'), adminVocabController.createSystemVocab);
route.post('/vocab/import', authorize('system.manage'), uploadCsv, adminVocabController.importCsv);
route.put('/vocab/:id', authorize('system.manage'), adminVocabController.updateSystemVocab);
route.delete('/vocab/:id', authorize('system.manage'), adminVocabController.deleteSystemVocab);

import { subscriptionController } from '@/controllers/subscriptionController';
route.get('/subscriptions', authorize('system.manage'), subscriptionController.getAdminSubscriptionList);
route.post('/subscriptions/:id/approve', authorize('system.manage'), subscriptionController.approveSubscription);
route.post('/subscriptions/:id/reject', authorize('system.manage'), subscriptionController.rejectSubscription);
route.put('/subscriptions/:id', authorize('system.manage'), subscriptionController.editPendingSubscription);
route.post('/subscriptions/:id/revoke', authorize('system.manage'), subscriptionController.revokeSubscription);
route.delete('/subscriptions/:id', authorize('system.manage'), subscriptionController.deleteSubscription);

route.get('/subscriptions/banned-accounts', authorize('system.manage'), subscriptionController.getBannedBankAccounts);
route.post('/subscriptions/banned-accounts', authorize('system.manage'), subscriptionController.banBankAccount);
route.delete('/subscriptions/banned-accounts/:id', authorize('system.manage'), subscriptionController.unbanBankAccount);

import { grammarController } from '@/controllers/grammarController';
route.get('/grammar', authorize('system.manage'), grammarController.getAdminTopics);
route.post('/grammar', authorize('system.manage'), grammarController.createTopic);
route.put('/grammar/questions/:questionId', authorize('system.manage'), grammarController.updateTopicQuestion);
route.delete('/grammar/questions/:questionId', authorize('system.manage'), grammarController.deleteTopicQuestion);
route.get('/grammar/:id', authorize('system.manage'), grammarController.getAdminTopicById);
route.put('/grammar/:id', authorize('system.manage'), grammarController.updateTopic);
route.delete('/grammar/:id', authorize('system.manage'), grammarController.deleteTopic);
route.get('/grammar/:id/questions', authorize('system.manage'), grammarController.getTopicQuestions);
route.post('/grammar/:id/questions', authorize('system.manage'), grammarController.createTopicQuestion);

export default route;
