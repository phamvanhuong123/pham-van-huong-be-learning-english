import { Router } from 'express';
import { profileController } from '@/controllers/profileController';
import { authenticate } from '@/middlewares/authenticate';
import { uploadAvatar } from '@/middlewares/uploadMiddleware';

const route = Router();

route.use(authenticate);

route.get('/', profileController.getProfile);
route.put('/', profileController.updateProfile);
route.post('/avatar', uploadAvatar, profileController.uploadAvatar);
route.put('/change-password', profileController.changePassword);
route.get('/stats', profileController.getStats);
route.delete('/', profileController.deleteAccount);

export default route;
