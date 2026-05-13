import { Router } from 'express';
import multer from 'multer';
import * as subscriptionController from '../controllers/subscriptionController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Cấu hình multer để lưu ảnh bằng chứng (tạm thời trong memory trước khi đẩy lên Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ định dạng hình ảnh'));
    }
  },
});

router.use(authenticate);

router.post('/', upload.single('proof'), subscriptionController.createRequest);
router.get('/me', subscriptionController.getMyHistory);
router.get('/pending', subscriptionController.getPendingStatus);

export default router;
