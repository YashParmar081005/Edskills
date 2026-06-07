import { Router } from 'express';
import {
  saveQuiz,
  getQuizByLesson,
  deleteQuiz,
  attemptQuiz,
  getMyAttempt,
  getMyQuizzes,
  getInstructorQuizzes,
} from '../controllers/quiz.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Student: all my quizzes (literal path before "/:id" params)
router.get('/mine', protect, getMyQuizzes);
// Instructor: all quizzes across owned courses
router.get('/instructor', protect, authorize('instructor', 'admin'), getInstructorQuizzes);

// Instructor/admin
router.post('/', protect, authorize('instructor', 'admin'), saveQuiz);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteQuiz);

// Shared / student (role-aware inside the controller)
router.get('/lesson/:lessonId', protect, getQuizByLesson);
router.post('/:id/attempt', protect, attemptQuiz);
router.get('/:id/my-attempt', protect, getMyAttempt);

export default router;
