import mongoose from 'mongoose';
import { Coupon } from '../models/Coupon.js';
import { Course } from '../models/Course.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

async function ownCourseOr403(courseId, user) {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, 'Course not found.');
  if (String(course.instructor) !== String(user._id) && user.role !== 'admin') {
    throw new ApiError(403, 'You do not own this course.');
  }
  return course;
}

/**
 * Validate a code against a course; throws on any problem, returns the coupon.
 * Shared by POST /coupons/validate and the checkout flow.
 */
export async function resolveCoupon(code, courseId) {
  const coupon = await Coupon.findOne({
    course: courseId,
    code: String(code || '').trim().toUpperCase(),
  });
  if (!coupon || !coupon.active) throw new ApiError(400, 'Invalid coupon code.');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, 'This coupon has expired.');
  if (coupon.maxRedemptions > 0 && coupon.timesRedeemed >= coupon.maxRedemptions) {
    throw new ApiError(400, 'This coupon has reached its redemption limit.');
  }
  return coupon;
}

const discounted = (price, percentOff) =>
  Math.max(0, Math.round(price * (1 - percentOff / 100) * 100) / 100);

/** POST /api/coupons   (instructor/admin) */
export const createCoupon = asyncHandler(async (req, res) => {
  const { code, courseId, percentOff, maxRedemptions, expiresAt } = req.body;
  if (!mongoose.isValidObjectId(courseId)) throw new ApiError(400, 'Invalid course id.');
  const pct = Number(percentOff);
  if (!Number.isFinite(pct) || pct < 1 || pct > 100) throw new ApiError(400, 'Discount must be 1–100%.');
  if (!String(code || '').trim()) throw new ApiError(400, 'A code is required.');

  await ownCourseOr403(courseId, req.user);

  const normalized = String(code).trim().toUpperCase();
  const exists = await Coupon.findOne({ course: courseId, code: normalized });
  if (exists) throw new ApiError(409, 'A coupon with this code already exists for this course.');

  const coupon = await Coupon.create({
    code: normalized,
    course: courseId,
    instructor: req.user._id,
    percentOff: pct,
    maxRedemptions: Math.max(0, Number(maxRedemptions) || 0),
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  });

  res.status(201).json({ success: true, coupon });
});

/** GET /api/coupons   (instructor/admin) — all of the user's coupons. */
export const listMyCoupons = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { instructor: req.user._id };
  const coupons = await Coupon.find(filter)
    .sort({ createdAt: -1 })
    .populate('course', 'title price')
    .lean();
  res.json({ success: true, coupons });
});

/** DELETE /api/coupons/:id   (owner/admin) */
export const deleteCoupon = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid id.');
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found.');
  if (String(coupon.instructor) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only delete your own coupons.');
  }
  await coupon.deleteOne();
  res.json({ success: true, message: 'Coupon deleted.' });
});

/** POST /api/coupons/validate   (protect) — Body: { code, courseId } */
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, courseId } = req.body;
  if (!mongoose.isValidObjectId(courseId)) throw new ApiError(400, 'Invalid course id.');
  const course = await Course.findById(courseId).lean();
  if (!course) throw new ApiError(404, 'Course not found.');

  const coupon = await resolveCoupon(code, courseId);
  res.json({
    success: true,
    valid: true,
    code: coupon.code,
    percentOff: coupon.percentOff,
    originalPrice: course.price,
    discountedPrice: discounted(course.price, coupon.percentOff),
  });
});
