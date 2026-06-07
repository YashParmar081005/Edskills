import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Module } from '../models/Module.js';
import { Lesson } from '../models/Lesson.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ensureCourseOwner } from '../utils/courseAccess.js';
import { indexLesson, removeLessonIndex } from '../services/rag.service.js';

/** Load a lesson + its course and assert ownership. */
async function loadOwnedLesson(lessonId, user) {
  if (!mongoose.isValidObjectId(lessonId)) throw new ApiError(400, 'Invalid lesson id.');
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new ApiError(404, 'Lesson not found.');
  const course = await Course.findById(lesson.course);
  ensureCourseOwner(course, user);
  return lesson;
}

const LESSON_FIELDS = ['title', 'type', 'videoUrl', 'content', 'duration', 'resources'];

function applyLessonFields(lesson, body) {
  for (const f of LESSON_FIELDS) {
    if (body[f] !== undefined) lesson[f] = body[f];
  }
}

/**
 * POST /api/modules/:id/lessons
 */
export const addLesson = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid module id.');
  }
  const mod = await Module.findById(req.params.id);
  if (!mod) throw new ApiError(404, 'Module not found.');
  const course = await Course.findById(mod.course);
  ensureCourseOwner(course, req.user);

  const count = await Lesson.countDocuments({ module: mod._id });
  const lesson = new Lesson({
    module: mod._id,
    course: course._id,
    order: count,
    type: req.body.type || 'text',
  });
  applyLessonFields(lesson, req.body);
  await lesson.save();
  await indexLesson(lesson).catch(() => {}); // RAG index (non-fatal)

  res.status(201).json({ success: true, lesson });
});

/**
 * PUT /api/lessons/:id
 */
export const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await loadOwnedLesson(req.params.id, req.user);
  applyLessonFields(lesson, req.body);
  await lesson.save();
  await indexLesson(lesson).catch(() => {}); // re-index for RAG (non-fatal)
  res.json({ success: true, lesson });
});

/**
 * DELETE /api/lessons/:id
 */
export const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await loadOwnedLesson(req.params.id, req.user);
  await lesson.deleteOne();
  await removeLessonIndex(lesson._id).catch(() => {});
  res.json({ success: true, message: 'Lesson deleted.' });
});

/**
 * PUT /api/modules/:id/lessons/reorder   body: { orderedIds: [lessonId, ...] }
 */
export const reorderLessons = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid module id.');
  }
  const mod = await Module.findById(req.params.id);
  if (!mod) throw new ApiError(404, 'Module not found.');
  const course = await Course.findById(mod.course);
  ensureCourseOwner(course, req.user);

  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    throw new ApiError(400, 'orderedIds must be an array.');
  }

  await Promise.all(
    orderedIds.map((id, idx) =>
      Lesson.updateOne({ _id: id, module: mod._id }, { $set: { order: idx } })
    )
  );

  res.json({ success: true, message: 'Lessons reordered.' });
});
