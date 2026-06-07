import { Router } from 'express';
import {
  deleteReply,
  upvoteReply,
  markAnswer,
} from '../controllers/forum.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.delete('/:id', protect, deleteReply);
router.post('/:id/upvote', protect, upvoteReply);
router.post('/:id/answer', protect, markAnswer);

export default router;
