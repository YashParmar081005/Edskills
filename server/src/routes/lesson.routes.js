import { Router } from 'express';
import { updateLesson, deleteLesson } from '../controllers/lesson.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { lessonValidator } from '../validators/course.validators.js';

const router = Router();

router.use(protect, authorize('instructor', 'admin'));

router.put('/:id', lessonValidator, validate, updateLesson);
router.delete('/:id', deleteLesson);

export default router;
