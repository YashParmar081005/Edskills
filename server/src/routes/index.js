import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import courseRoutes from './course.routes.js';
import moduleRoutes from './module.routes.js';
import lessonRoutes from './lesson.routes.js';
import uploadRoutes from './upload.routes.js';
import enrollmentRoutes from './enrollment.routes.js';
import progressRoutes from './progress.routes.js';
import aiRoutes from './ai.routes.js';
import quizRoutes from './quiz.routes.js';
import assignmentRoutes from './assignment.routes.js';
import submissionRoutes from './submission.routes.js';
import threadRoutes from './thread.routes.js';
import replyRoutes from './reply.routes.js';
import notificationRoutes from './notification.routes.js';

/**
 * Root API router. Mount every feature router here so app.js stays clean.
 * Future phases add: /payments, /certificates, /analytics, etc.
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
router.use('/ai', aiRoutes);
router.use('/quizzes', quizRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/submissions', submissionRoutes);
router.use('/threads', threadRoutes);
router.use('/replies', replyRoutes);
router.use('/notifications', notificationRoutes);

export default router;
