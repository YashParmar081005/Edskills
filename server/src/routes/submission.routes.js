import { Router } from 'express';
import {
  gradeSubmission,
  aiSuggestGrade,
} from '../controllers/assignment.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect, authorize('instructor', 'admin'));

router.post('/:id/grade', gradeSubmission);
router.post('/:id/ai-suggest', aiSuggestGrade);

export default router;
