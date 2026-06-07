import { Router } from 'express';
import {
  getNotifications,
  markRead,
  markAllRead,
  broadcast,
} from '../controllers/notification.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.post('/read-all', markAllRead);
router.post('/broadcast', authorize('admin'), broadcast);
router.post('/:id/read', markRead);

export default router;
