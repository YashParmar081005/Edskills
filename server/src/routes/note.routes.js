import { Router } from 'express';
import {
  getMyNotes,
  getCourseStudyState,
  upsertLessonNote,
  getMyBookmarks,
  toggleBookmark,
} from '../controllers/note.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

// Notes
router.get('/', getMyNotes);
router.get('/course/:courseId', getCourseStudyState);
router.put('/lesson/:lessonId', upsertLessonNote);

export const bookmarkRouter = Router();
bookmarkRouter.use(protect);
bookmarkRouter.get('/', getMyBookmarks);
bookmarkRouter.post('/lesson/:lessonId', toggleBookmark);

export default router;
