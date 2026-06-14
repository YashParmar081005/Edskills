import { Router } from 'express';
import { getMyGamification, getLeaderboard } from '../controllers/gamification.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/me', protect, getMyGamification);
router.get('/leaderboard', protect, getLeaderboard);

export default router;
