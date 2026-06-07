import { Router } from 'express';
import { getMyEnrollments } from '../controllers/enrollment.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/me', protect, getMyEnrollments);

export default router;
