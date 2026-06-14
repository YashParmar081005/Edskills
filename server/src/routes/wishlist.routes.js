import { Router } from 'express';
import {
  getMyWishlist,
  getWishlistIds,
  toggleWishlist,
} from '../controllers/wishlist.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', getMyWishlist);
router.get('/ids', getWishlistIds);
router.post('/:courseId', toggleWishlist);

export default router;
