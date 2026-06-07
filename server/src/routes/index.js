import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import courseRoutes from './course.routes.js';
import moduleRoutes from './module.routes.js';
import lessonRoutes from './lesson.routes.js';
import uploadRoutes from './upload.routes.js';

/**
 * Root API router. Mount every feature router here so app.js stays clean.
 * Future phases add: /enrollments, /progress, /ai, /quizzes,
 * /assignments, /threads, /payments, etc.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/modules', moduleRoutes);
router.use('/lessons', lessonRoutes);
router.use('/upload', uploadRoutes);

export default router;
