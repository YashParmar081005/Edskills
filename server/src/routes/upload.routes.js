import { Router } from 'express';
import {
  uploadVideoFile,
  uploadThumbnailFile,
  uploadAvatarFile,
  uploadGenericFile,
} from '../controllers/upload.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadVideo, uploadImage, uploadAny, runUpload } from '../middleware/upload.js';

const router = Router();

// Instructor/admin media
router.post(
  '/video',
  protect,
  authorize('instructor', 'admin'),
  runUpload(uploadVideo),
  uploadVideoFile
);
router.post(
  '/thumbnail',
  protect,
  authorize('instructor', 'admin'),
  runUpload(uploadImage),
  uploadThumbnailFile
);

// Profile avatar — any authenticated user
router.post('/avatar', protect, runUpload(uploadImage), uploadAvatarFile);

// Generic file (assignment submissions) — any authenticated user
router.post('/file', protect, runUpload(uploadAny), uploadGenericFile);

export default router;
