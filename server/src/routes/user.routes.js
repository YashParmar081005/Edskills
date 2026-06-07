import { Router } from 'express';
import {
  listUsers,
  updateUserRole,
  deleteUser,
} from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/', listUsers);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
