import mongoose from 'mongoose';
import { Wishlist } from '../models/Wishlist.js';
import { Course } from '../models/Course.js';
import { Module } from '../models/Module.js';
import { Lesson } from '../models/Lesson.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

/** GET /api/wishlist  → the student's saved courses (full cards) + id list. */
export const getMyWishlist = asyncHandler(async (req, res) => {
  const items = await Wishlist.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate({ path: 'course', populate: { path: 'instructor', select: 'name' } })
    .lean();

  const courses = items.map((w) => w.course).filter(Boolean);
  const ids = courses.map((c) => c._id);

  const [moduleCounts, lessonCounts] = await Promise.all([
    Module.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: '$course', n: { $sum: 1 } } }]),
    Lesson.aggregate([{ $match: { course: { $in: ids } } }, { $group: { _id: '$course', n: { $sum: 1 } } }]),
  ]);
  const mMap = Object.fromEntries(moduleCounts.map((m) => [String(m._id), m.n]));
  const lMap = Object.fromEntries(lessonCounts.map((l) => [String(l._id), l.n]));

  res.json({
    success: true,
    courses: courses.map((c) => ({
      ...c,
      moduleCount: mMap[String(c._id)] || 0,
      lessonCount: lMap[String(c._id)] || 0,
    })),
    courseIds: courses.map((c) => String(c._id)),
  });
});

/** GET /api/wishlist/ids  → just the saved course ids (for heart toggles). */
export const getWishlistIds = asyncHandler(async (req, res) => {
  const items = await Wishlist.find({ student: req.user._id }).select('course').lean();
  res.json({ success: true, courseIds: items.map((w) => String(w.course)) });
});

/** POST /api/wishlist/:courseId  → toggle a course in/out of the wishlist. */
export const toggleWishlist = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) throw new ApiError(400, 'Invalid course id.');

  const course = await Course.findById(courseId).select('_id');
  if (!course) throw new ApiError(404, 'Course not found.');

  const existing = await Wishlist.findOne({ student: req.user._id, course: courseId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ success: true, wishlisted: false });
  }
  await Wishlist.create({ student: req.user._id, course: courseId });
  res.json({ success: true, wishlisted: true });
});
