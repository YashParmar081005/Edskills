import { Router } from 'express';
import {
  getMyCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
} from '../controllers/course.controller.js';
import { addModule, reorderModules } from '../controllers/module.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCourseValidator,
  updateCourseValidator,
  moduleValidator,
} from '../validators/course.validators.js';

const router = Router();

// Every course-management route is instructor/admin only.
router.use(protect, authorize('instructor', 'admin'));

router.get('/mine', getMyCourses);
router.post('/', createCourseValidator, validate, createCourse);

router.get('/:id', getCourse);
router.put('/:id', updateCourseValidator, validate, updateCourse);
router.delete('/:id', deleteCourse);
router.post('/:id/publish', togglePublish);

// Modules nested under a course
router.post('/:id/modules', moduleValidator, validate, addModule);
router.put('/:id/modules/reorder', reorderModules);

export default router;
