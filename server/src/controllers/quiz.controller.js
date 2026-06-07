import mongoose from 'mongoose';
import { Quiz } from '../models/Quiz.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { Lesson } from '../models/Lesson.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ensureCourseOwner } from '../utils/courseAccess.js';
import { gradeOpenAnswer } from '../services/ai/index.js';

/** Normalize/validate incoming questions for save. */
function normalizeQuestions(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ApiError(400, 'A quiz needs at least one question.');
  }
  return raw.map((q, i) => {
    const type = q.type === 'open' ? 'open' : 'mcq';
    const question = String(q.question || '').trim();
    if (!question) throw new ApiError(400, `Question ${i + 1} is missing its text.`);

    if (type === 'mcq') {
      const options = (q.options || []).map((o) => String(o).trim()).filter(Boolean);
      if (options.length < 2) {
        throw new ApiError(400, `Question ${i + 1} needs at least 2 options.`);
      }
      let correctIndex = Number(q.correctIndex) || 0;
      if (correctIndex < 0 || correctIndex >= options.length) correctIndex = 0;
      return {
        type,
        question,
        options,
        correctIndex,
        explanation: String(q.explanation || '').trim(),
        points: Number(q.points) > 0 ? Number(q.points) : 1,
      };
    }
    return {
      type: 'open',
      question,
      options: [],
      correctIndex: 0,
      explanation: String(q.explanation || '').trim(),
      points: Number(q.points) > 0 ? Number(q.points) : 1,
    };
  });
}

/** Student-safe view of a quiz: no correctIndex / explanation leaked. */
function stripForStudent(quiz) {
  return {
    _id: quiz._id,
    lesson: quiz.lesson,
    course: quiz.course,
    title: quiz.title,
    questions: quiz.questions.map((q) => ({
      type: q.type,
      question: q.question,
      options: q.options,
      points: q.points,
    })),
  };
}

async function loadOwnedLesson(lessonId, user) {
  if (!mongoose.isValidObjectId(lessonId)) throw new ApiError(400, 'Invalid lesson id.');
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new ApiError(404, 'Lesson not found.');
  const course = await Course.findById(lesson.course);
  ensureCourseOwner(course, user);
  return lesson;
}

/**
 * POST /api/quizzes   (instructor/admin, owner)
 * Body: { lessonId, title?, questions[], aiGenerated? }
 * Upserts the single quiz attached to a lesson.
 */
export const saveQuiz = asyncHandler(async (req, res) => {
  const { lessonId, title, questions, aiGenerated } = req.body;
  const lesson = await loadOwnedLesson(lessonId, req.user);
  const normalized = normalizeQuestions(questions);

  let quiz = await Quiz.findOne({ lesson: lesson._id });
  if (quiz) {
    quiz.title = title || quiz.title;
    quiz.questions = normalized;
    quiz.aiGenerated = !!aiGenerated;
    await quiz.save();
  } else {
    quiz = await Quiz.create({
      lesson: lesson._id,
      course: lesson.course,
      title: title || 'Lesson Quiz',
      questions: normalized,
      aiGenerated: !!aiGenerated,
    });
  }

  res.status(201).json({ success: true, quiz });
});

/**
 * GET /api/quizzes/lesson/:lessonId   (protect)
 * Role-aware: owner/admin gets the full quiz; an enrolled student gets the
 * answer-stripped quiz plus their latest attempt.
 */
export const getQuizByLesson = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  if (!mongoose.isValidObjectId(lessonId)) throw new ApiError(400, 'Invalid lesson id.');

  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) throw new ApiError(404, 'Lesson not found.');
  const course = await Course.findById(lesson.course).lean();

  const quiz = await Quiz.findOne({ lesson: lessonId }).lean();
  if (!quiz) return res.json({ success: true, quiz: null });

  const isOwner =
    String(course.instructor) === String(req.user._id) || req.user.role === 'admin';

  if (isOwner) {
    return res.json({ success: true, quiz });
  }

  const enrolled = await Enrollment.exists({ student: req.user._id, course: course._id });
  if (!enrolled) throw new ApiError(403, 'Enroll in this course to access its quizzes.');

  const attempt = await QuizAttempt.findOne({ student: req.user._id, quiz: quiz._id })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, quiz: stripForStudent(quiz), attempt: attempt || null });
});

/**
 * DELETE /api/quizzes/:id   (instructor/admin, owner)
 */
export const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new ApiError(404, 'Quiz not found.');
  const course = await Course.findById(quiz.course);
  ensureCourseOwner(course, req.user);

  await QuizAttempt.deleteMany({ quiz: quiz._id });
  await quiz.deleteOne();

  res.json({ success: true, message: 'Quiz deleted.' });
});

/**
 * POST /api/quizzes/:id/attempt   (protect — enrolled student or owner)
 * Body: { answers: [{ questionIndex, selectedIndex?, text? }] }
 * MCQs are auto-scored; open answers are graded by the AI service.
 */
export const attemptQuiz = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid quiz id.');
  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) throw new ApiError(404, 'Quiz not found.');

  const course = await Course.findById(quiz.course).lean();
  const isOwner =
    String(course.instructor) === String(req.user._id) || req.user.role === 'admin';
  if (!isOwner) {
    const enrolled = await Enrollment.exists({ student: req.user._id, course: course._id });
    if (!enrolled) throw new ApiError(403, 'Enroll in this course to take its quizzes.');
  }

  const submitted = Array.isArray(req.body.answers) ? req.body.answers : [];
  const byIndex = new Map(submitted.map((a) => [Number(a.questionIndex), a]));

  let score = 0;
  let maxScore = 0;
  const results = [];

  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    const a = byIndex.get(i) || {};
    const pts = q.points || 1;
    maxScore += pts;

    if (q.type === 'open') {
      let awarded = 0;
      let feedback = '';
      try {
        const g = await gradeOpenAnswer({
          question: q.question,
          answer: a.text || '',
          maxPoints: pts,
        });
        awarded = g.score;
        feedback = g.feedback;
      } catch {
        feedback = 'Automatic grading is unavailable right now; your instructor will review this answer.';
      }
      score += awarded;
      results.push({
        questionIndex: i,
        type: 'open',
        text: a.text || '',
        pointsAwarded: awarded,
        feedback,
        explanation: q.explanation,
      });
    } else {
      const selectedIndex = Number.isInteger(a.selectedIndex) ? a.selectedIndex : null;
      const correct = selectedIndex === q.correctIndex;
      const awarded = correct ? pts : 0;
      score += awarded;
      results.push({
        questionIndex: i,
        type: 'mcq',
        selectedIndex,
        correct,
        correctIndex: q.correctIndex,
        pointsAwarded: awarded,
        explanation: q.explanation,
      });
    }
  }

  const percentage = maxScore ? Math.round((score / maxScore) * 100) : 0;

  const attempt = await QuizAttempt.create({
    student: req.user._id,
    quiz: quiz._id,
    course: quiz.course,
    answers: results.map((r) => ({
      questionIndex: r.questionIndex,
      selectedIndex: r.selectedIndex ?? null,
      text: r.text || '',
      correct: !!r.correct,
      pointsAwarded: r.pointsAwarded,
      feedback: r.feedback || '',
    })),
    score,
    maxScore,
    percentage,
  });

  res.status(201).json({
    success: true,
    attemptId: attempt._id,
    score,
    maxScore,
    percentage,
    results, // includes correctIndex + explanation for review
  });
});

/**
 * GET /api/quizzes/mine   (protect)
 * Every quiz across the student's enrolled courses + their latest score.
 */
export const getMyQuizzes = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id }).select('course').lean();
  const courseIds = enrollments.map((e) => e.course);

  const quizzes = await Quiz.find({ course: { $in: courseIds } })
    .populate('lesson', 'title')
    .populate('course', 'title')
    .sort({ updatedAt: -1 })
    .lean();

  const quizIds = quizzes.map((q) => q._id);
  const attempts = await QuizAttempt.aggregate([
    { $match: { student: req.user._id, quiz: { $in: quizIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$quiz', percentage: { $first: '$percentage' } } },
  ]);
  const attMap = Object.fromEntries(attempts.map((a) => [String(a._id), a.percentage]));

  res.json({
    success: true,
    quizzes: quizzes.map((q) => ({
      _id: q._id,
      title: q.title,
      questionCount: q.questions.length,
      aiGenerated: q.aiGenerated,
      course: q.course,
      lesson: q.lesson,
      lastScore: attMap[String(q._id)] ?? null,
    })),
  });
});

/**
 * GET /api/quizzes/instructor   (instructor/admin)
 * All quizzes across the instructor's courses.
 */
export const getInstructorQuizzes = asyncHandler(async (req, res) => {
  const courseFilter = req.user.role === 'admin' ? {} : { instructor: req.user._id };
  const courses = await Course.find(courseFilter).select('_id').lean();
  const courseIds = courses.map((c) => c._id);

  const quizzes = await Quiz.find({ course: { $in: courseIds } })
    .populate('lesson', 'title')
    .populate('course', 'title')
    .sort({ updatedAt: -1 })
    .lean();

  res.json({
    success: true,
    quizzes: quizzes.map((q) => ({
      _id: q._id,
      title: q.title,
      questionCount: q.questions.length,
      aiGenerated: q.aiGenerated,
      course: q.course,
      lesson: q.lesson,
    })),
  });
});

/**
 * GET /api/quizzes/:id/my-attempt   (protect)
 * The student's most recent attempt (or null).
 */
export const getMyAttempt = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid quiz id.');
  const attempt = await QuizAttempt.findOne({
    student: req.user._id,
    quiz: req.params.id,
  })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, attempt: attempt || null });
});
