import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Module } from '../models/Module.js';
import { Lesson } from '../models/Lesson.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ensureCourseOwner } from '../utils/courseAccess.js';

/**
 * GET /api/courses/mine
 * Courses owned by the logged-in instructor (admins see all).
 */
export const getMyCourses = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { instructor: req.user._id };
  const courses = await Course.find(filter)
    .sort({ updatedAt: -1 })
    .populate('instructor', 'name email')
    .lean();

  // Attach lightweight counts so the list cards can show module/lesson totals.
  const ids = courses.map((c) => c._id);
  const [moduleCounts, lessonCounts] = await Promise.all([
    Module.aggregate([
      { $match: { course: { $in: ids } } },
      { $group: { _id: '$course', n: { $sum: 1 } } },
    ]),
    Lesson.aggregate([
      { $match: { course: { $in: ids } } },
      { $group: { _id: '$course', n: { $sum: 1 } } },
    ]),
  ]);
  const mMap = Object.fromEntries(moduleCounts.map((m) => [String(m._id), m.n]));
  const lMap = Object.fromEntries(lessonCounts.map((l) => [String(l._id), l.n]));

  const data = courses.map((c) => ({
    ...c,
    moduleCount: mMap[String(c._id)] || 0,
    lessonCount: lMap[String(c._id)] || 0,
  }));

  res.json({ success: true, courses: data });
});

/**
 * GET /api/courses/:id
 * Full course with nested modules → lessons. Owner/admin only (Phase 3).
 */
export const getCourse = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid course id.');
  }
  const course = await Course.findById(req.params.id)
    .populate('instructor', 'name email')
    .lean();
  if (!course) throw new ApiError(404, 'Course not found.');

  ensureCourseOwner(course, req.user);

  const [modules, lessons] = await Promise.all([
    Module.find({ course: course._id }).sort({ order: 1, createdAt: 1 }).lean(),
    Lesson.find({ course: course._id }).sort({ order: 1, createdAt: 1 }).lean(),
  ]);

  const lessonsByModule = lessons.reduce((acc, l) => {
    const key = String(l.module);
    (acc[key] = acc[key] || []).push(l);
    return acc;
  }, {});

  const nestedModules = modules.map((m) => ({
    ...m,
    lessons: lessonsByModule[String(m._id)] || [],
  }));

  res.json({ success: true, course: { ...course, modules: nestedModules } });
});

/**
 * POST /api/courses
 */
export const createCourse = asyncHandler(async (req, res) => {
  const { title, description, price, category, tags, thumbnail } = req.body;

  const course = await Course.create({
    title,
    description: description || '',
    price: price ?? 0,
    category: category || 'Other',
    tags: Array.isArray(tags) ? tags : [],
    thumbnail: thumbnail || '',
    instructor: req.user._id,
  });

  res.status(201).json({ success: true, course });
});

/**
 * PUT /api/courses/:id
 */
export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  ensureCourseOwner(course, req.user);

  const fields = ['title', 'description', 'price', 'category', 'tags', 'thumbnail'];
  for (const f of fields) {
    if (req.body[f] !== undefined) course[f] = req.body[f];
  }
  await course.save();

  res.json({ success: true, course });
});

/**
 * DELETE /api/courses/:id  (cascades to modules + lessons)
 */
export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  ensureCourseOwner(course, req.user);

  await Promise.all([
    Lesson.deleteMany({ course: course._id }),
    Module.deleteMany({ course: course._id }),
  ]);
  await course.deleteOne();

  res.json({ success: true, message: 'Course deleted.' });
});

/**
 * POST /api/courses/:id/publish  — toggle (or set via body.isPublished)
 */
export const togglePublish = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  ensureCourseOwner(course, req.user);

  const next =
    typeof req.body?.isPublished === 'boolean'
      ? req.body.isPublished
      : !course.isPublished;

  if (next) {
    // Don't allow publishing an empty course.
    const lessonCount = await Lesson.countDocuments({ course: course._id });
    if (lessonCount === 0) {
      throw new ApiError(400, 'Add at least one lesson before publishing.');
    }
  }

  course.isPublished = next;
  await course.save();

  res.json({
    success: true,
    course,
    message: next ? 'Course published.' : 'Course unpublished.',
  });
});
