import { Lesson } from '../models/Lesson.js';
import { Course } from '../models/Course.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ensureCourseOwner } from '../utils/courseAccess.js';
import {
  generateQuizQuestions,
  gradeOpenAnswer,
  isAIConfigured,
} from '../services/ai/index.js';

function assertAI() {
  if (!isAIConfigured()) {
    throw new ApiError(
      503,
      'AI is not configured. Add GROQ_API_KEY to the server .env (free key at https://console.groq.com/keys).'
    );
  }
}

/**
 * POST /api/ai/quiz/generate   (instructor/admin, owner)
 * Body: { lessonId, numQuestions? }
 * Returns generated questions (a draft — not saved yet).
 */
export const generateQuiz = asyncHandler(async (req, res) => {
  assertAI();
  const { lessonId, numQuestions } = req.body;

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new ApiError(404, 'Lesson not found.');
  const course = await Course.findById(lesson.course);
  ensureCourseOwner(course, req.user);

  // Use the lesson's text; fall back to title + course title for thin lessons.
  const parts = [course.title, lesson.title, lesson.content].filter(Boolean);
  const content = parts.join('\n').trim();
  if (content.length < 15) {
    throw new ApiError(
      400,
      'This lesson has too little text to generate a quiz. Add some lesson content first.'
    );
  }

  try {
    const questions = await generateQuizQuestions(content, {
      numQuestions: numQuestions || 5,
      title: lesson.title,
    });
    res.json({ success: true, questions });
  } catch (err) {
    throw new ApiError(502, `Quiz generation failed: ${err.message}`);
  }
});

/**
 * POST /api/ai/grade   (instructor/admin)
 * Body: { question, answer, maxPoints?, rubric? }
 */
export const gradeAnswer = asyncHandler(async (req, res) => {
  assertAI();
  const { question, answer, maxPoints, rubric } = req.body;
  if (!question) throw new ApiError(400, 'A question is required.');

  try {
    const result = await gradeOpenAnswer({
      question,
      answer,
      maxPoints: Number(maxPoints) || 1,
      rubric,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    throw new ApiError(502, `Grading failed: ${err.message}`);
  }
});
