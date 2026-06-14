import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Module } from '../models/Module.js';
import { Lesson } from '../models/Lesson.js';
import { Enrollment } from '../models/Enrollment.js';
import { Progress } from '../models/Progress.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ensureCourseOwner } from '../utils/courseAccess.js';
import { removeCourseIndex } from '../services/rag.service.js';
import { notify } from '../services/notification.service.js';

/** A course is visible to the public only when published AND admin-cleared. */
function isPubliclyVisible(course) {
  return course.isPublished && course.status !== 'pending' && course.status !== 'rejected';
}

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
  // Public catalog: published AND not awaiting/blocked by review.
  const filter = { isPublished: true, status: { $nin: ['pending', 'rejected'] } };
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

  if (!isOwner && !isPubliclyVisible(course)) {
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
    if (!isPubliclyVisible(course)) throw new ApiError(404, 'Course not found.');
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
 * POST /api/courses/:id/publish  — toggle published state.
 * Only allowed once the course is admin-approved (admins may toggle anything).
 */
export const togglePublish = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  ensureCourseOwner(course, req.user);

  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && course.status !== 'approved') {
    throw new ApiError(
      400,
      'This course must be approved by an admin before you can publish it. Submit it for review first.'
    );
  }

  const next =
    typeof req.body?.isPublished === 'boolean' ? req.body.isPublished : !course.isPublished;

  if (next) {
    const lessonCount = await Lesson.countDocuments({ course: course._id });
    if (lessonCount === 0) throw new ApiError(400, 'Add at least one lesson before publishing.');
  }

  course.isPublished = next;
  // Admins toggling an un-reviewed course implicitly approve it.
  if (isAdmin && next && course.status !== 'approved') course.status = 'approved';
  await course.save();

  res.json({
    success: true,
    course,
    message: next ? 'Course published.' : 'Course unpublished.',
  });
});

/**
 * POST /api/courses/:id/submit  (instructor) — submit a draft for admin review.
 */
export const submitForReview = asyncHandler(async (req, res) => {
  // No populate here — ensureCourseOwner compares the raw instructor ObjectId.
  const course = await Course.findById(req.params.id);
  ensureCourseOwner(course, req.user);

  if (course.status === 'pending') throw new ApiError(400, 'This course is already awaiting review.');
  if (course.status === 'approved') throw new ApiError(400, 'This course is already approved.');

  const lessonCount = await Lesson.countDocuments({ course: course._id });
  if (lessonCount === 0) throw new ApiError(400, 'Add at least one lesson before submitting for review.');

  course.status = 'pending';
  course.reviewNote = '';
  await course.save();

  // Notify all admins there's a course awaiting review (the owner is req.user).
  const admins = await User.find({ role: 'admin' }).select('_id').lean();
  await Promise.all(
    admins.map((a) =>
      notify({
        user: a._id,
        type: 'system',
        message: `New course awaiting review: "${course.title}" by ${req.user.name}.`,
        link: '/admin/approvals',
        actor: req.user._id,
      })
    )
  );

  res.json({ success: true, course, message: 'Submitted for review.' });
});

/**
 * GET /api/courses/admin/pending  (admin) — courses awaiting review.
 */
export const getPendingCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ status: 'pending' })
    .sort({ updatedAt: 1 })
    .populate('instructor', 'name email')
    .lean();
  res.json({ success: true, courses: await withCounts(courses) });
});

/**
 * POST /api/courses/:id/review  (admin) — approve or reject a pending course.
 * Body: { decision: 'approve' | 'reject', note? }
 */
export const reviewCourse = asyncHandler(async (req, res) => {
  const { decision, note } = req.body;
  if (!['approve', 'reject'].includes(decision)) {
    throw new ApiError(400, "decision must be 'approve' or 'reject'.");
  }

  const course = await Course.findById(req.params.id).populate('instructor', 'name');
  if (!course) throw new ApiError(404, 'Course not found.');

  const approved = decision === 'approve';
  course.status = approved ? 'approved' : 'rejected';
  course.isPublished = approved; // approving publishes it; rejecting hides it
  course.reviewNote = String(note || '').slice(0, 1000);
  course.reviewedAt = new Date();
  course.reviewedBy = req.user._id;
  await course.save();

  await notify({
    user: course.instructor._id,
    type: 'system',
    message: approved
      ? `🎉 Your course "${course.title}" was approved and is now live.`
      : `Your course "${course.title}" needs changes${course.reviewNote ? `: ${course.reviewNote}` : '.'}`,
    link: `/instructor/courses/${course._id}`,
    actor: req.user._id,
  });

  res.json({
    success: true,
    course,
    message: approved ? 'Course approved & published.' : 'Course sent back to the instructor.',
  });
});
