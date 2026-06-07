import { Router } from 'express';
import {
  getThread,
  deleteThread,
  createReply,
  upvoteThread,
} from '../controllers/forum.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/:id', protect, getThread);
router.delete('/:id', protect, deleteThread);
router.post('/:id/replies', protect, createReply);
router.post('/:id/upvote', protect, upvoteThread);

export default router;
