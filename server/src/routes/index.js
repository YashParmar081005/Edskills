import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import courseRoutes from './course.routes.js';
import moduleRoutes from './module.routes.js';
import lessonRoutes from './lesson.routes.js';
import uploadRoutes from './upload.routes.js';
import enrollmentRoutes from './enrollment.routes.js';
import progressRoutes from './progress.routes.js';

/**
 * Root API router. Mount every feature router here so app.js stays clean.
 * Future phases add: /ai, /quizzes, /assignments, /threads, /payments, etc.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/modules', moduleRoutes);
router.use('/lessons', lessonRoutes);
router.use('/upload', uploadRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/progress', progressRoutes);

export default router;
