import mongoose from 'mongoose';
import { Note } from '../models/Note.js';
import { Bookmark } from '../models/Bookmark.js';
import { Lesson } from '../models/Lesson.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

/** GET /api/notes  → all of the student's notes (newest first), with titles. */
export const getMyNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({ student: req.user._id, content: { $ne: '' } })
    .sort({ updatedAt: -1 })
    .populate('lesson', 'title')
    .populate('course', 'title')
    .lean();
  res.json({ success: true, notes });
});

/**
 * GET /api/notes/course/:courseId
 * Player state: this student's notes + bookmarked lesson ids for one course.
 */
export const getCourseStudyState = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId)) throw new ApiError(400, 'Invalid course id.');

  const [notes, bookmarks] = await Promise.all([
    Note.find({ student: req.user._id, course: courseId }).select('lesson content').lean(),
    Bookmark.find({ student: req.user._id, course: courseId }).select('lesson').lean(),
  ]);

  const noteMap = {};
  notes.forEach((n) => {
    noteMap[String(n.lesson)] = n.content;
  });

  res.json({
    success: true,
    notes: noteMap,
    bookmarkLessonIds: bookmarks.map((b) => String(b.lesson)),
  });
});

/** PUT /api/notes/lesson/:lessonId  → upsert this student's note for a lesson. */
export const upsertLessonNote = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  if (!mongoose.isValidObjectId(lessonId)) throw new ApiError(400, 'Invalid lesson id.');

  const lesson = await Lesson.findById(lessonId).select('course');
  if (!lesson) throw new ApiError(404, 'Lesson not found.');

  const content = String(req.body.content || '').slice(0, 10000);
  const note = await Note.findOneAndUpdate(
    { student: req.user._id, lesson: lessonId },
    { $set: { content, course: lesson.course } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, note });
});

/** GET /api/bookmarks  → the student's bookmarked lessons. */
export const getMyBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate('lesson', 'title type')
    .populate('course', 'title')
    .lean();
  res.json({ success: true, bookmarks });
});

/** POST /api/bookmarks/lesson/:lessonId  → toggle a lesson bookmark. */
export const toggleBookmark = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  if (!mongoose.isValidObjectId(lessonId)) throw new ApiError(400, 'Invalid lesson id.');

  const lesson = await Lesson.findById(lessonId).select('course');
  if (!lesson) throw new ApiError(404, 'Lesson not found.');

  const existing = await Bookmark.findOne({ student: req.user._id, lesson: lessonId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ success: true, bookmarked: false });
  }
  await Bookmark.create({ student: req.user._id, lesson: lessonId, course: lesson.course });
  res.json({ success: true, bookmarked: true });
});
