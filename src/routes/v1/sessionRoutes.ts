import { Router } from 'express';
import { sessionController } from '@/controllers/sessionController';
import { authenticate } from '@/middlewares/authenticate';

const route = Router();

route.use(authenticate);

route.get('/', sessionController.getSessions);
route.delete('/', sessionController.revokeAllOther);
route.delete('/:id', sessionController.revokeOne);

export default route;
