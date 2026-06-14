import { Router } from 'express';
import {
  createCoupon,
  listMyCoupons,
  deleteCoupon,
  validateCoupon,
} from '../controllers/coupon.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/validate', protect, validateCoupon);
router.post('/', protect, authorize('instructor', 'admin'), createCoupon);
router.get('/', protect, authorize('instructor', 'admin'), listMyCoupons);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCoupon);

export default router;
