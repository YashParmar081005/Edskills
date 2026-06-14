import { Router } from 'express';
import {
  createCheckout,
  confirmPayment,
  webhook,
  listPayments,
  getEarnings,
} from '../controllers/payment.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Stripe calls this with a raw, signed body (parsed in app.js). No auth.
router.post('/webhook', webhook);

router.get('/earnings', protect, authorize('instructor', 'admin'), getEarnings);
router.get('/', protect, authorize('admin'), listPayments);
router.post('/checkout', protect, createCheckout);
router.post('/confirm', protect, confirmPayment);

export default router;
