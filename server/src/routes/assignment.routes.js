import { Router } from 'express';
import {
  getAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getMySubmission,
  listSubmissions,
  getMyAssignments,
} from '../controllers/assignment.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Instructor hub — literal path BEFORE "/:id"
router.get('/mine', protect, authorize('instructor', 'admin'), getMyAssignments);

// Role-aware / student
router.get('/:id', protect, getAssignment);
router.post('/:id/submit', protect, submitAssignment);
router.get('/:id/my-submission', protect, getMySubmission);

// Instructor/admin
router.put('/:id', protect, authorize('instructor', 'admin'), updateAssignment);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteAssignment);
router.get('/:id/submissions', protect, authorize('instructor', 'admin'), listSubmissions);

export default router;
