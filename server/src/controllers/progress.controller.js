import mongoose from 'mongoose';
import { Lesson } from '../models/Lesson.js';
import { Enrollment } from '../models/Enrollment.js';
import { Progress } from '../models/Progress.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { awardXp, XP } from '../services/gamification.service.js';

/** Recompute course % and sync the enrollment's completed status. */
async function recomputeCourse(studentId, courseId) {
  const [total, done] = await Promise.all([
    Lesson.countDocuments({ course: courseId }),
    Progress.countDocuments({ student: studentId, course: courseId, completed: true }),
  ]);
  const percent = total ? Math.round((done / total) * 100) : 0;

  const isComplete = total > 0 && done >= total;
  await Enrollment.updateOne(
    { student: studentId, course: courseId },
    { $set: { status: isComplete ? 'completed' : 'active', completedAt: isComplete ? new Date() : null } }
  );

  return { percent, totalLessons: total, completedLessons: done };
}

/**
 * POST /api/progress   (protect)
 * Body: { lessonId, completed?: bool, watchedSeconds?: number }
 * Upserts the student's progress for a lesson and returns the new course %.
 */
export const saveProgress = asyncHandler(async (req, res) => {
  const { lessonId, completed, watchedSeconds } = req.body;
  if (!mongoose.isValidObjectId(lessonId)) {
    throw new ApiError(400, 'A valid lessonId is required.');
  }

  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) throw new ApiError(404, 'Lesson not found.');

  const enrolled = await Enrollment.exists({ student: req.user._id, course: lesson.course });
  if (!enrolled) {
    throw new ApiError(403, 'Enroll in this course to track progress.');
  }

  // Capture prior state to award XP only on first-time transitions.
  const [priorProgress, priorEnroll] = await Promise.all([
    Progress.findOne({ student: req.user._id, lesson: lessonId }).select('completed').lean(),
    Enrollment.findOne({ student: req.user._id, course: lesson.course }).select('status').lean(),
  ]);
  const wasCompleted = priorProgress?.completed === true;

  const set = { course: lesson.course };
  if (typeof completed === 'boolean') {
    set.completed = completed;
    set.completedAt = completed ? new Date() : null;
  }
  if (typeof watchedSeconds === 'number' && watchedSeconds >= 0) {
    set.watchedSeconds = Math.round(watchedSeconds);
  }

  const progress = await Progress.findOneAndUpdate(
    { student: req.user._id, lesson: lessonId },
    { $set: set },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const summary = await recomputeCourse(req.user._id, lesson.course);

  // Gamification (fire-and-forget) — only on first completion / course finish.
  if (set.completed === true && !wasCompleted) {
    awardXp(req.user._id, XP.lesson, { action: 'lesson' });
    if (summary.percent === 100 && priorEnroll?.status !== 'completed') {
      awardXp(req.user._id, XP.courseComplete, { action: 'courseComplete' });
    }
  }

  res.json({ success: true, progress, ...summary });
});

/**
 * GET /api/courses/:id/progress   (protect)
 * Progress summary for the current student in a course.
 */
export const getCourseProgress = asyncHandler(async (req, res) => {
  const courseId = req.params.id;
  if (!mongoose.isValidObjectId(courseId)) {
    throw new ApiError(400, 'Invalid course id.');
  }

  const [total, records] = await Promise.all([
    Lesson.countDocuments({ course: courseId }),
    Progress.find({ student: req.user._id, course: courseId }).lean(),
  ]);

  const completedLessonIds = records.filter((p) => p.completed).map((p) => String(p.lesson));
  const watched = Object.fromEntries(records.map((p) => [String(p.lesson), p.watchedSeconds || 0]));
  const percent = total ? Math.round((completedLessonIds.length / total) * 100) : 0;

  res.json({
    success: true,
    percent,
    totalLessons: total,
    completedLessons: completedLessonIds.length,
    completedLessonIds,
    watched,
  });
});
