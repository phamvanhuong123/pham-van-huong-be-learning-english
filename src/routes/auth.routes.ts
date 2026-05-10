import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authValidation } from '../validations/authovalidation';

const router = Router();

router.post('/register', authValidation.register, authController.register);
router.post('/login', authValidation.login, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authValidation.forgotPassword, authController.forgotPassword);
router.post('/reset-password', authValidation.resetPassword, authController.resetPassword);

export default router;
