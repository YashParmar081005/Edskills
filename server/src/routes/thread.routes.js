import { Router } from 'express';
import {
  getThread,
  deleteThread,
  createReply,
  upvoteThread,
  getMyThreads,
} from '../controllers/forum.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Instructor hub — literal path BEFORE "/:id"
router.get('/mine', protect, authorize('instructor', 'admin'), getMyThreads);

router.get('/:id', protect, getThread);
router.delete('/:id', protect, deleteThread);
router.post('/:id/replies', protect, createReply);
router.post('/:id/upvote', protect, upvoteThread);

export default router;
