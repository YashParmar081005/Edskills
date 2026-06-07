import { Router } from 'express';
import { generateQuiz, gradeAnswer, generateAvatar } from '../controllers/ai.controller.js';
import { askCourse, chatAssistant } from '../controllers/rag.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Every AI route requires auth and is metered per user (cost/abuse control).
router.use(protect, aiLimiter);

// Instructor/admin
router.post('/quiz/generate', authorize('instructor', 'admin'), generateQuiz);
router.post('/grade', authorize('instructor', 'admin'), gradeAnswer);

// Any authenticated user (enrollment checked in the controllers)
router.post('/ask', askCourse);
router.post('/chat', chatAssistant);
router.post('/avatar', generateAvatar);

export default router;
