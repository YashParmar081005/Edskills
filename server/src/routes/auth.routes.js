import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  me,
  updateMe,
  changePassword,
} from '../controllers/auth.controller.js';
import {
  registerValidator,
  loginValidator,
  updateMeValidator,
  changePasswordValidator,
} from '../validators/auth.validators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, me);
router.patch('/me', protect, updateMeValidator, validate, updateMe);
router.post('/me/password', protect, changePasswordValidator, validate, changePassword);

export default router;
