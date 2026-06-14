import { Lesson } from '../models/Lesson.js';
import { Course } from '../models/Course.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ensureCourseOwner } from '../utils/courseAccess.js';
import {
  generateQuizQuestions,
  gradeOpenAnswer,
  generateAvatarSeeds,
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
      meta: { user: req.user._id, type: 'quiz' },
    });
    res.json({ success: true, questions });
  } catch (err) {
    throw new ApiError(502, `Quiz generation failed: ${err.message}`);
  }
});

/* -------------------------------- AI avatars -------------------------------- */

// Cartoon avatar styles rendered deterministically by DiceBear from a seed.
const AVATAR_STYLES = [
  'adventurer',
  'avataaars',
  'bottts',
  'fun-emoji',
  'lorelei',
  'notionists',
  'micah',
  'personas',
  'thumbs',
  'big-smile',
  'open-peeps',
  'pixel-art',
];

// Blue / sky palette (no '#') to match the app theme.
const AVATAR_BG = '0ea5e9,38bdf8,2563eb,60a5fa,93c5fd,c0aede';

function buildAvatarUrl(style, seed) {
  const s = encodeURIComponent(seed);
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${s}&radius=18&backgroundColor=${AVATAR_BG}`;
}

/**
 * POST /api/ai/avatar   (any authenticated user)
 * Body: { prompt? }
 * Returns a set of AI-themed avatar options. The LLM invents the persona seeds;
 * DiceBear renders them. Always returns options even if the LLM is unavailable.
 */
export const generateAvatar = asyncHandler(async (req, res) => {
  const count = 8;
  const prompt =
    typeof req.body?.prompt === 'string' ? req.body.prompt.trim().slice(0, 120) : '';
  const name = req.user?.name || '';

  let seeds = [];
  let aiUsed = false;

  if (isAIConfigured()) {
    try {
      seeds = await generateAvatarSeeds({ name, prompt, count, meta: { user: req.user._id, type: 'avatar' } });
      aiUsed = seeds.length > 0;
    } catch {
      seeds = []; // fall back below
    }
  }

  // Top up (or fully populate) with varied deterministic seeds so the button
  // always works — even without an LLM key or if generation partially fails.
  if (seeds.length < count) {
    const base = (prompt || name || 'avatar').replace(/\s+/g, '-').toLowerCase();
    const spice = ['nova', 'spark', 'pixel', 'orbit', 'echo', 'lumen', 'quartz', 'zephyr'];
    const salt = Date.now() % 100000;
    for (let i = seeds.length; i < count; i++) {
      seeds.push(`${base}-${spice[i % spice.length]}-${salt}-${i}`);
    }
  }

  const avatars = seeds.slice(0, count).map((seed, i) => {
    const style = AVATAR_STYLES[i % AVATAR_STYLES.length];
    return { url: buildAvatarUrl(style, seed), style, seed };
  });

  res.json({ success: true, avatars, aiUsed });
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
      meta: { user: req.user._id, type: 'grade' },
    });
    res.json({ success: true, ...result });
  } catch (err) {
    throw new ApiError(502, `Grading failed: ${err.message}`);
  }
});
