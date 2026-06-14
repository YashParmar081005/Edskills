import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { retrieveChunks } from '../services/rag.service.js';
import { answerCourseQuestion, assistantChat, isAIConfigured } from '../services/ai/index.js';

/**
 * POST /api/ai/ask   (protect — enrolled student or course owner)
 * Body: { courseId, question }
 * Retrieves relevant lesson chunks and answers WITH citations.
 */
export const askCourse = asyncHandler(async (req, res) => {
  if (!isAIConfigured()) {
    throw new ApiError(503, 'AI is not configured. Add GROQ_API_KEY to the server .env.');
  }
  const { courseId, question } = req.body;
  if (!mongoose.isValidObjectId(courseId)) throw new ApiError(400, 'Invalid course id.');
  if (!question || !question.trim()) throw new ApiError(400, 'A question is required.');

  const course = await Course.findById(courseId).lean();
  if (!course) throw new ApiError(404, 'Course not found.');

  const isOwner =
    String(course.instructor) === String(req.user._id) || req.user.role === 'admin';
  if (!isOwner) {
    const enrolled = await Enrollment.exists({ student: req.user._id, course: course._id });
    if (!enrolled) throw new ApiError(403, 'Enroll in this course to ask the AI assistant.');
  }

  const chunks = await retrieveChunks(course._id, question.trim(), 6);
  if (chunks.length === 0) {
    return res.json({
      success: true,
      answer:
        "This course doesn't have enough text content indexed yet for me to answer. Try adding text lessons.",
      citations: [],
    });
  }

  try {
    const { answer, sources } = await answerCourseQuestion({
      question: question.trim(),
      chunks,
      meta: { user: req.user._id, type: 'ask' },
    });

    // Map cited excerpt numbers → unique lessons.
    const used = sources.length ? sources : chunks.map((_, i) => i + 1);
    const seen = new Set();
    const citations = [];
    for (const n of used) {
      const chunk = chunks[n - 1];
      if (chunk && !seen.has(String(chunk.lesson))) {
        seen.add(String(chunk.lesson));
        citations.push({ lessonId: chunk.lesson, lessonTitle: chunk.lessonTitle });
      }
    }

    res.json({ success: true, answer, citations });
  } catch (err) {
    throw new ApiError(502, `AI answer failed: ${err.message}`);
  }
});

/**
 * POST /api/ai/chat   (protect) — universal assistant.
 * Body: { messages: [{role,content}], courseId? }
 * General platform/study help everywhere; when courseId is given and the user
 * has access, course content is retrieved and the reply can cite lessons.
 */
export const chatAssistant = asyncHandler(async (req, res) => {
  if (!isAIConfigured()) {
    throw new ApiError(503, 'AI is not configured. Add GROQ_API_KEY to the server .env.');
  }
  const { messages = [], courseId, docText } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ApiError(400, 'messages are required.');
  }
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  if (!lastUser.trim()) throw new ApiError(400, 'A user message is required.');

  // Optional text from a file the user attached in the chat.
  const docContext = typeof docText === 'string' ? docText.slice(0, 16000) : '';

  // Course context (only if the user can access that course).
  let chunks = [];
  let courseContext = '';
  if (courseId && mongoose.isValidObjectId(courseId)) {
    const course = await Course.findById(courseId).lean();
    if (course) {
      const isOwner =
        String(course.instructor) === String(req.user._id) || req.user.role === 'admin';
      const canAccess =
        isOwner || (await Enrollment.exists({ student: req.user._id, course: course._id }));
      if (canAccess) {
        chunks = await retrieveChunks(course._id, lastUser, 5);
        if (chunks.length) {
          courseContext = chunks
            .map((c, i) => `[${i + 1}] (lesson "${c.lessonTitle}") ${c.chunkText}`)
            .join('\n\n');
        }
      }
    }
  }

  try {
    const { reply, sources } = await assistantChat({
      role: req.user.role,
      messages,
      courseContext,
      docContext,
      meta: { user: req.user._id, type: 'chat' },
    });

    const seen = new Set();
    const citations = [];
    for (const n of sources) {
      const ch = chunks[n - 1];
      if (ch && !seen.has(String(ch.lesson))) {
        seen.add(String(ch.lesson));
        citations.push({ lessonId: ch.lesson, lessonTitle: ch.lessonTitle });
      }
    }

    res.json({ success: true, reply, citations });
  } catch (err) {
    throw new ApiError(502, `AI assistant failed: ${err.message}`);
  }
});
