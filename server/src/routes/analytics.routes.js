import { Router } from 'express';
import {
  instructorAnalytics,
  adminAnalytics,
  studentAnalytics,
} from '../controllers/analytics.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { protect, authorize } from '../middleware/auth.js';
import { checkAndSendReminders } from '../services/email.service.js';

const router = Router();

router.get('/instructor', protect, authorize('instructor', 'admin'), instructorAnalytics);
router.get('/admin', protect, authorize('admin'), adminAnalytics);
router.get('/student', protect, studentAnalytics);

// Manually trigger assignment due-date reminder emails (also runs on a daily cron).
router.post(
  '/send-reminders',
  protect,
  authorize('admin', 'instructor'),
  asyncHandler(async (req, res) => {
    const sent = await checkAndSendReminders();
    res.json({ success: true, sent });
  })
);

export default router;
