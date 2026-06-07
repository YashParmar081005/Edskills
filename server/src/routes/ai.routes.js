import { Router } from 'express';
import { generateQuiz, gradeAnswer } from '../controllers/ai.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect, authorize('instructor', 'admin'));

router.post('/quiz/generate', generateQuiz);
router.post('/grade', gradeAnswer);

export default router;
