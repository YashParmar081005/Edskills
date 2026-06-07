import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Lesson } from '../models/Lesson.js';
import { Enrollment } from '../models/Enrollment.js';
import { Progress } from '../models/Progress.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * POST /api/courses/:id/enroll   (protect)
 * Enroll the current user in a published course. Free only for now —
 * paid courses are handled in Phase 8 (Stripe).
 */
export const enroll = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid course id.');
  }
  const course = await Course.findById(req.params.id);
  if (!course || !course.isPublished) {
    throw new ApiError(404, 'Course not found.');
  }
  if (course.price > 0) {
    throw new ApiError(402, 'This is a paid course. Checkout arrives in Phase 8.');
  }

  const existing = await Enrollment.findOne({ student: req.user._id, course: course._id });
  if (existing) {
    return res.json({ success: true, alreadyEnrolled: true, enrollment: existing });
  }

  const enrollment = await Enrollment.create({
    student: req.user._id,
    course: course._id,
  });
  await Course.updateOne({ _id: course._id }, { $inc: { totalEnrollments: 1 } });

  res.status(201).json({ success: true, enrollment });
});

/**
 * GET /api/enrollments/me   (protect)
 * The current user's enrolled courses, each with a progress summary.
 */
export const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'course',
      populate: { path: 'instructor', select: 'name' },
    })
    .lean();

  // Drop enrollments whose course was deleted.
  const valid = enrollments.filter((e) => e.course);
  const courseIds = valid.map((e) => e.course._id);

  const [lessonCounts, completedCounts] = await Promise.all([
    Lesson.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: '$course', n: { $sum: 1 } } },
    ]),
    Progress.aggregate([
      {
        $match: {
          student: req.user._id,
          course: { $in: courseIds },
          completed: true,
        },
      },
      { $group: { _id: '$course', n: { $sum: 1 } } },
    ]),
  ]);
  const totalMap = Object.fromEntries(lessonCounts.map((l) => [String(l._id), l.n]));
  const doneMap = Object.fromEntries(completedCounts.map((c) => [String(c._id), c.n]));

  const data = valid.map((e) => {
    const total = totalMap[String(e.course._id)] || 0;
    const done = doneMap[String(e.course._id)] || 0;
    return {
      ...e,
      totalLessons: total,
      completedLessons: done,
      progressPercent: total ? Math.round((done / total) * 100) : 0,
    };
  });

  res.json({ success: true, enrollments: data });
});
