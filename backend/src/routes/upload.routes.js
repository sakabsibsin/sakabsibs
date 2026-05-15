import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/upload.controller.js';
import { requireAuth } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files allowed'));
    cb(null, true);
  },
});

const router = Router();
router.post('/', requireAuth, upload.single('image'), uploadImage);

router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB.' });
  }
  if (err.message === 'Only image files allowed') {
    return res.status(400).json({ success: false, message: 'Only image files are supported (JPEG, PNG, WebP).' });
  }
  next(err);
});

export default router;
