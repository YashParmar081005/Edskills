import { Router } from 'express';
import { saveProgress } from '../controllers/progress.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/', protect, saveProgress);

export default router;
