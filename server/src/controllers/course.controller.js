import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Module } from '../models/Module.js';
import { Lesson } from '../models/Lesson.js';
import { Enrollment } from '../models/Enrollment.js';
import { Progress } from '../models/Progress.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ensureCourseOwner } from '../utils/courseAccess.js';
import { removeCourseIndex } from '../services/rag.service.js';

/** Attach lesson counts (moduleCount/lessonCount) to a list of course docs. */
async function withCounts(courses) {
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
  return courses.map((c) => ({
    ...c,
    moduleCount: mMap[String(c._id)] || 0,
    lessonCount: lMap[String(c._id)] || 0,
  }));
}

/** Nest sorted lessons under their sorted modules. */
function nestCurriculum(modules, lessons) {
  const byModule = lessons.reduce((acc, l) => {
    (acc[String(l.module)] = acc[String(l.module)] || []).push(l);
    return acc;
  }, {});
  return modules.map((m) => ({ ...m, lessons: byModule[String(m._id)] || [] }));
}

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

  res.json({ success: true, courses: await withCounts(courses) });
});

/**
 * GET /api/courses
 * Public catalog of PUBLISHED courses with search/filter/sort.
 * Query: q (search), category, sort (newest|popular|priceLow|priceHigh)
 */
export const listPublicCourses = asyncHandler(async (req, res) => {
  const { q, category, sort } = req.query;
  const filter = { isPublished: true };
  if (category && category !== 'All') filter.category = category;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } },
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    popular: { totalEnrollments: -1, createdAt: -1 },
    priceLow: { price: 1 },
    priceHigh: { price: -1 },
  };

  const courses = await Course.find(filter)
    .sort(sortMap[sort] || sortMap.newest)
    .populate('instructor', 'name')
    .lean();

  res.json({ success: true, courses: await withCounts(courses) });
});

/**
 * GET /api/courses/:id   (optionalAuth)
 * - Owner/admin: full course with lesson content (powers the builder).
 * - Anyone else: PUBLISHED courses only, curriculum OUTLINE (no content/videoUrl).
 *   Unpublished courses are hidden (404) from non-owners.
 * Adds `isOwner` and `isEnrolled` flags.
 */
export const getCourse = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid course id.');
  }
  const course = await Course.findById(req.params.id)
    .populate('instructor', 'name email avatar')
    .lean();
  if (!course) throw new ApiError(404, 'Course not found.');

  const isOwner =
    !!req.user &&
    (String(course.instructor._id) === String(req.user._id) || req.user.role === 'admin');

  if (!isOwner && !course.isPublished) {
    throw new ApiError(404, 'Course not found.');
  }

  const [modules, lessons] = await Promise.all([
    Module.find({ course: course._id }).sort({ order: 1, createdAt: 1 }).lean(),
    Lesson.find({ course: course._id }).sort({ order: 1, createdAt: 1 }).lean(),
  ]);

  // Non-owners get a preview outline (no content / video sources).
  const visibleLessons = isOwner
    ? lessons
    : lessons.map((l) => ({
        _id: l._id,
        module: l.module,
        course: l.course,
        title: l.title,
        type: l.type,
        duration: l.duration,
        order: l.order,
      }));

  let isEnrolled = false;
  if (req.user) {
    isEnrolled = !!(await Enrollment.exists({
      student: req.user._id,
      course: course._id,
    }));
  }

  res.json({
    success: true,
    course: {
      ...course,
      modules: nestCurriculum(modules, visibleLessons),
      isOwner,
      isEnrolled,
    },
  });
});

/**
 * GET /api/courses/:id/learn   (protect)
 * Full course content + this student's progress. Requires enrollment (or owner).
 */
export const getCourseLearn = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid course id.');
  }
  const course = await Course.findById(req.params.id)
    .populate('instructor', 'name avatar')
    .lean();
  if (!course) throw new ApiError(404, 'Course not found.');

  const isOwner =
    String(course.instructor._id) === String(req.user._id) || req.user.role === 'admin';

  if (!isOwner) {
    if (!course.isPublished) throw new ApiError(404, 'Course not found.');
    const enrolled = await Enrollment.exists({ student: req.user._id, course: course._id });
    if (!enrolled) throw new ApiError(403, 'Enroll in this course to start learning.');
  }

  const [modules, lessons, progressRecords] = await Promise.all([
    Module.find({ course: course._id }).sort({ order: 1, createdAt: 1 }).lean(),
    Lesson.find({ course: course._id }).sort({ order: 1, createdAt: 1 }).lean(),
    Progress.find({ student: req.user._id, course: course._id }).lean(),
  ]);

  const progressByLesson = Object.fromEntries(
    progressRecords.map((p) => [String(p.lesson), p])
  );

  const lessonsWithProgress = lessons.map((l) => {
    const p = progressByLesson[String(l._id)];
    return {
      ...l,
      completed: p?.completed || false,
      watchedSeconds: p?.watchedSeconds || 0,
    };
  });

  const totalLessons = lessons.length;
  const completedLessons = progressRecords.filter((p) => p.completed).length;
  const percent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  res.json({
    success: true,
    course: {
      ...course,
      modules: nestCurriculum(modules, lessonsWithProgress),
      isOwner,
    },
    progress: { percent, totalLessons, completedLessons },
  });
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
    removeCourseIndex(course._id).catch(() => {}),
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
