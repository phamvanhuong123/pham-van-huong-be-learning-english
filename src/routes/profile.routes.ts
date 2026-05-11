import { Router } from 'express';
import multer from 'multer';
import { getProfile, updateProfile, updateAvatar } from '../controllers/profileController';
import { authenticate } from '../middleware/auth';


const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ định dạng JPEG, PNG hoặc WebP'));
    }
  },
});

router.get('/', authenticate, getProfile);
router.patch('/', authenticate, updateProfile);
router.post('/avatar', authenticate, upload.single('avatar'), updateAvatar);

export default router;
