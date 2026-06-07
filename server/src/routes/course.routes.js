import { Router } from 'express';
import {
  getMyCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
  listPublicCourses,
  getCourseLearn,
} from '../controllers/course.controller.js';
import { addModule, reorderModules } from '../controllers/module.controller.js';
import { enroll } from '../controllers/enrollment.controller.js';
import { getCourseProgress } from '../controllers/progress.controller.js';
import {
  createAssignment,
  listCourseAssignments,
} from '../controllers/assignment.controller.js';
import { listThreads, createThread } from '../controllers/forum.controller.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCourseValidator,
  updateCourseValidator,
  moduleValidator,
} from '../validators/course.validators.js';

const router = Router();
const instructor = [protect, authorize('instructor', 'admin')];

/* ---------------------------------- Public ---------------------------------- */
router.get('/', listPublicCourses); // browse published courses

/* ----------------------------- Instructor (mine) ---------------------------- */
// Literal "/mine" MUST be declared before the "/:id" param route.
router.get('/mine', ...instructor, getMyCourses);
router.post('/', ...instructor, createCourseValidator, validate, createCourse);

/* --------------------------- Student: enroll / learn ------------------------ */
router.post('/:id/enroll', protect, enroll);
router.get('/:id/learn', protect, getCourseLearn);
router.get('/:id/progress', protect, getCourseProgress);

/* ------------------------------- Assignments -------------------------------- */
router.get('/:id/assignments', protect, listCourseAssignments);
router.post('/:id/assignments', ...instructor, createAssignment);

/* ---------------------------------- Forum ----------------------------------- */
router.get('/:id/threads', protect, listThreads);
router.post('/:id/threads', protect, createThread);

/* --------------------------- Public-or-owner detail ------------------------- */
router.get('/:id', optionalAuth, getCourse);

/* ------------------------- Instructor management on :id --------------------- */
router.put('/:id', ...instructor, updateCourseValidator, validate, updateCourse);
router.delete('/:id', ...instructor, deleteCourse);
router.post('/:id/publish', ...instructor, togglePublish);
router.post('/:id/modules', ...instructor, moduleValidator, validate, addModule);
router.put('/:id/modules/reorder', ...instructor, reorderModules);

export default router;
