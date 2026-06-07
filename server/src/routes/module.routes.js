import { Router } from 'express';
import {
  updateModule,
  deleteModule,
} from '../controllers/module.controller.js';
import { addLesson, reorderLessons } from '../controllers/lesson.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { moduleValidator, lessonValidator } from '../validators/course.validators.js';

const router = Router();

router.use(protect, authorize('instructor', 'admin'));

router.put('/:id', moduleValidator, validate, updateModule);
router.delete('/:id', deleteModule);

// Lessons nested under a module
router.post('/:id/lessons', lessonValidator, validate, addLesson);
router.put('/:id/lessons/reorder', reorderLessons);

export default router;
