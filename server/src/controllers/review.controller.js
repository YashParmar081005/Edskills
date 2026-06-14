import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

/** Recompute and persist a course's denormalized rating average + count. */
async function recomputeCourseRating(courseId) {
  const [agg] = await Review.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    { $group: { _id: '$course', avg: { $avg: '$rating' }, n: { $sum: 1 } } },
  ]);
  await Course.findByIdAndUpdate(courseId, {
    ratingAvg: agg ? Math.round(agg.avg * 10) / 10 : 0,
    ratingCount: agg ? agg.n : 0,
  });
}

/**
 * GET /api/courses/:id/reviews   (public)
 * List a course's reviews (newest first) + the current user's own review.
 */
export const listReviews = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid course id.');

  const reviews = await Review.find({ course: req.params.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('student', 'name avatar')
    .lean();

  let mine = null;
  if (req.user) {
    mine = reviews.find((r) => String(r.student?._id) === String(req.user._id)) || null;
  }

  const course = await Course.findById(req.params.id).select('ratingAvg ratingCount').lean();

  res.json({
    success: true,
    reviews,
    mine,
    ratingAvg: course?.ratingAvg || 0,
    ratingCount: course?.ratingCount || 0,
  });
});

/**
 * POST /api/courses/:id/reviews   (protect — enrolled students)
 * Body: { rating, comment } → create or update the user's review (upsert).
 */
export const upsertReview = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid course id.');
  const rating = Number(req.body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5.');
  }
  const comment = typeof req.body.comment === 'string' ? req.body.comment.trim().slice(0, 2000) : '';

  const course = await Course.findById(req.params.id).lean();
  if (!course) throw new ApiError(404, 'Course not found.');

  // Owners can't review their own course; everyone else must be enrolled.
  if (String(course.instructor) === String(req.user._id)) {
    throw new ApiError(403, 'You cannot review your own course.');
  }
  const enrolled = await Enrollment.exists({ student: req.user._id, course: course._id });
  if (!enrolled && req.user.role !== 'admin') {
    throw new ApiError(403, 'Enroll in this course to leave a review.');
  }

  const review = await Review.findOneAndUpdate(
    { course: course._id, student: req.user._id },
    { $set: { rating, comment } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate('student', 'name avatar');

  await recomputeCourseRating(course._id);

  res.status(201).json({ success: true, review });
});

/**
 * DELETE /api/reviews/:id   (protect — author or admin)
 */
export const deleteReview = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid id.');
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found.');

  if (String(review.student) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only delete your own review.');
  }

  const courseId = review.course;
  await review.deleteOne();
  await recomputeCourseRating(courseId);

  res.json({ success: true, message: 'Review deleted.' });
});
