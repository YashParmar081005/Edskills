import mongoose from 'mongoose';
import { ForumThread } from '../models/ForumThread.js';
import { ForumReply } from '../models/ForumReply.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { notify } from '../services/notification.service.js';
import { emitToThread, emitToCourse } from '../sockets/index.js';

/* --------------------------------- helpers ---------------------------------- */

async function getAccessibleCourse(courseId, user) {
  if (!mongoose.isValidObjectId(courseId)) throw new ApiError(400, 'Invalid course id.');
  const course = await Course.findById(courseId).lean();
  if (!course) throw new ApiError(404, 'Course not found.');
  const isOwner =
    String(course.instructor) === String(user._id) || user.role === 'admin';
  if (!isOwner) {
    const enrolled = await Enrollment.exists({ student: user._id, course: course._id });
    if (!enrolled) throw new ApiError(403, 'Enroll in this course to access its forum.');
  }
  return { course, isOwner };
}

const shapeUpvotes = (doc, userId) => ({
  ...doc,
  upvoteCount: doc.upvotes?.length || 0,
  hasUpvoted: (doc.upvotes || []).some((u) => String(u) === String(userId)),
  upvotes: undefined,
});

/* --------------------------------- threads ---------------------------------- */

/** GET /api/courses/:id/threads */
export const listThreads = asyncHandler(async (req, res) => {
  const { course } = await getAccessibleCourse(req.params.id, req.user);

  const threads = await ForumThread.find({ course: course._id })
    .sort({ updatedAt: -1 })
    .populate('author', 'name avatar role')
    .lean();

  const ids = threads.map((t) => t._id);
  const stats = await ForumReply.aggregate([
    { $match: { thread: { $in: ids } } },
    {
      $group: {
        _id: '$thread',
        replies: { $sum: 1 },
        answered: { $max: { $cond: ['$isAnswer', 1, 0] } },
      },
    },
  ]);
  const map = Object.fromEntries(stats.map((s) => [String(s._id), s]));

  const data = threads.map((t) => ({
    ...shapeUpvotes(t, req.user._id),
    replyCount: map[String(t._id)]?.replies || 0,
    answered: !!map[String(t._id)]?.answered,
  }));

  res.json({ success: true, threads: data, courseTitle: course.title });
});

/** POST /api/courses/:id/threads  Body: { title, body } */
export const createThread = asyncHandler(async (req, res) => {
  const { course } = await getAccessibleCourse(req.params.id, req.user);
  const { title, body } = req.body;
  if (!title || !title.trim()) throw new ApiError(400, 'A thread title is required.');

  let thread = await ForumThread.create({
    course: course._id,
    author: req.user._id,
    title: title.trim(),
    body: (body || '').trim(),
  });
  thread = await thread.populate('author', 'name avatar role');

  const shaped = { ...shapeUpvotes(thread.toObject(), req.user._id), replyCount: 0, answered: false };
  emitToCourse(course._id, 'course:threads', { courseId: String(course._id) });

  // Notify the instructor about a new question.
  await notify({
    user: course.instructor,
    actor: req.user._id,
    type: 'thread',
    message: `${req.user.name} posted "${thread.title}" in ${course.title}`,
    link: `/threads/${thread._id}`,
  });

  res.status(201).json({ success: true, thread: shaped });
});

/** GET /api/threads/:id  → thread + replies */
export const getThread = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid thread id.');
  const thread = await ForumThread.findById(req.params.id)
    .populate('author', 'name avatar role')
    .lean();
  if (!thread) throw new ApiError(404, 'Thread not found.');

  const { isOwner } = await getAccessibleCourse(thread.course, req.user);

  const replies = await ForumReply.find({ thread: thread._id })
    .sort({ isAnswer: -1, createdAt: 1 })
    .populate('author', 'name avatar role')
    .lean();

  res.json({
    success: true,
    thread: shapeUpvotes(thread, req.user._id),
    replies: replies.map((r) => shapeUpvotes(r, req.user._id)),
    canModerate: isOwner, // course owner/admin can always mark answers
    isThreadAuthor: String(thread.author._id) === String(req.user._id),
  });
});

/** DELETE /api/threads/:id  (author or owner/admin) */
export const deleteThread = asyncHandler(async (req, res) => {
  const thread = await ForumThread.findById(req.params.id);
  if (!thread) throw new ApiError(404, 'Thread not found.');
  const { isOwner } = await getAccessibleCourse(thread.course, req.user);
  if (!isOwner && String(thread.author) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only delete your own threads.');
  }
  await ForumReply.deleteMany({ thread: thread._id });
  await thread.deleteOne();
  emitToCourse(thread.course, 'course:threads', { courseId: String(thread.course) });
  res.json({ success: true, message: 'Thread deleted.' });
});

/* --------------------------------- replies ---------------------------------- */

/** POST /api/threads/:id/replies  Body: { body } */
export const createReply = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid thread id.');
  const thread = await ForumThread.findById(req.params.id);
  if (!thread) throw new ApiError(404, 'Thread not found.');
  const { course } = await getAccessibleCourse(thread.course, req.user);

  const body = (req.body.body || '').trim();
  if (!body) throw new ApiError(400, 'Reply text is required.');

  let reply = await ForumReply.create({
    thread: thread._id,
    course: course._id,
    author: req.user._id,
    body,
  });
  reply = await reply.populate('author', 'name avatar role');

  // Bump thread activity so it sorts to the top.
  await ForumThread.updateOne({ _id: thread._id }, { $currentDate: { updatedAt: true } });

  emitToThread(thread._id, 'thread:update', { threadId: String(thread._id) });
  emitToCourse(course._id, 'course:threads', { courseId: String(course._id) });

  // Notify the thread author and (separately) the instructor.
  await notify({
    user: thread.author,
    actor: req.user._id,
    type: 'reply',
    message: `${req.user.name} replied to "${thread.title}"`,
    link: `/threads/${thread._id}`,
  });
  if (String(course.instructor) !== String(thread.author)) {
    await notify({
      user: course.instructor,
      actor: req.user._id,
      type: 'reply',
      message: `${req.user.name} replied in "${thread.title}"`,
      link: `/threads/${thread._id}`,
    });
  }

  res.status(201).json({ success: true, reply: shapeUpvotes(reply.toObject(), req.user._id) });
});

/** DELETE /api/replies/:id  (author or owner/admin) */
export const deleteReply = asyncHandler(async (req, res) => {
  const reply = await ForumReply.findById(req.params.id);
  if (!reply) throw new ApiError(404, 'Reply not found.');
  const { isOwner } = await getAccessibleCourse(reply.course, req.user);
  if (!isOwner && String(reply.author) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only delete your own replies.');
  }
  await reply.deleteOne();
  emitToThread(reply.thread, 'thread:update', { threadId: String(reply.thread) });
  res.json({ success: true, message: 'Reply deleted.' });
});

/* -------------------------------- upvotes ----------------------------------- */

function toggleUpvote(arr, userId) {
  const id = String(userId);
  const exists = arr.some((u) => String(u) === id);
  return exists ? arr.filter((u) => String(u) !== id) : [...arr, userId];
}

/** POST /api/threads/:id/upvote */
export const upvoteThread = asyncHandler(async (req, res) => {
  const thread = await ForumThread.findById(req.params.id);
  if (!thread) throw new ApiError(404, 'Thread not found.');
  await getAccessibleCourse(thread.course, req.user);

  thread.upvotes = toggleUpvote(thread.upvotes, req.user._id);
  await thread.save();
  emitToThread(thread._id, 'thread:update', { threadId: String(thread._id) });
  emitToCourse(thread.course, 'course:threads', { courseId: String(thread.course) });

  res.json({
    success: true,
    upvoteCount: thread.upvotes.length,
    hasUpvoted: thread.upvotes.some((u) => String(u) === String(req.user._id)),
  });
});

/** POST /api/replies/:id/upvote */
export const upvoteReply = asyncHandler(async (req, res) => {
  const reply = await ForumReply.findById(req.params.id);
  if (!reply) throw new ApiError(404, 'Reply not found.');
  await getAccessibleCourse(reply.course, req.user);

  reply.upvotes = toggleUpvote(reply.upvotes, req.user._id);
  await reply.save();
  emitToThread(reply.thread, 'thread:update', { threadId: String(reply.thread) });

  res.json({
    success: true,
    upvoteCount: reply.upvotes.length,
    hasUpvoted: reply.upvotes.some((u) => String(u) === String(req.user._id)),
  });
});

/* ----------------------------- mark as answer ------------------------------- */

/** POST /api/replies/:id/answer  (course owner/admin or thread author) */
export const markAnswer = asyncHandler(async (req, res) => {
  const reply = await ForumReply.findById(req.params.id);
  if (!reply) throw new ApiError(404, 'Reply not found.');
  const thread = await ForumThread.findById(reply.thread);
  const { isOwner } = await getAccessibleCourse(reply.course, req.user);
  const isThreadAuthor = String(thread.author) === String(req.user._id);
  if (!isOwner && !isThreadAuthor) {
    throw new ApiError(403, 'Only the instructor or the thread author can mark an answer.');
  }

  const makeAnswer = !reply.isAnswer;
  // One answer per thread.
  await ForumReply.updateMany({ thread: thread._id }, { $set: { isAnswer: false } });
  if (makeAnswer) {
    reply.isAnswer = true;
    await reply.save();
  }
  thread.resolved = makeAnswer;
  await thread.save();

  emitToThread(thread._id, 'thread:update', { threadId: String(thread._id) });
  emitToCourse(thread.course, 'course:threads', { courseId: String(thread.course) });

  if (makeAnswer) {
    await notify({
      user: reply.author,
      actor: req.user._id,
      type: 'answer',
      message: `Your reply was marked as the answer in "${thread.title}"`,
      link: `/threads/${thread._id}`,
    });
  }

  res.json({ success: true, isAnswer: makeAnswer });
});
