import { Router } from 'express';
import {
  saveQuiz,
  getQuizByLesson,
  deleteQuiz,
  attemptQuiz,
  getMyAttempt,
} from '../controllers/quiz.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Instructor/admin
router.post('/', protect, authorize('instructor', 'admin'), saveQuiz);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteQuiz);

// Shared / student (role-aware inside the controller)
router.get('/lesson/:lessonId', protect, getQuizByLesson);
router.post('/:id/attempt', protect, attemptQuiz);
router.get('/:id/my-attempt', protect, getMyAttempt);

export default router;
