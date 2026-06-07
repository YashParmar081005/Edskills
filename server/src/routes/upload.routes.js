import { Router } from 'express';
import {
  uploadVideoFile,
  uploadThumbnailFile,
} from '../controllers/upload.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadVideo, uploadImage, runUpload } from '../middleware/upload.js';

const router = Router();

router.use(protect, authorize('instructor', 'admin'));

router.post('/video', runUpload(uploadVideo), uploadVideoFile);
router.post('/thumbnail', runUpload(uploadImage), uploadThumbnailFile);

export default router;
