import { chatJSON, isAIConfigured } from './provider.js';

export { isAIConfigured };

/* ------------------------------ Quiz generation ----------------------------- */

const QUIZ_SYSTEM =
  'You are an expert instructional designer who writes high-quality multiple-choice ' +
  'quizzes from lesson material. You ALWAYS respond with strict JSON only — no markdown, ' +
  'no commentary.';

function validQuiz(obj) {
  return (
    obj &&
    Array.isArray(obj.questions) &&
    obj.questions.length > 0 &&
    obj.questions.every(
      (q) =>
        typeof q.question === 'string' &&
        q.question.trim() &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        Number.isInteger(q.correctIndex) &&
        q.correctIndex >= 0 &&
        q.correctIndex < q.options.length
    )
  );
}

/**
 * Generate MCQ questions from lesson content.
 * @returns {Promise<Array<{type,question,options,correctIndex,explanation,points}>>}
 */
export async function generateQuizQuestions(content, { numQuestions = 5, title = '' } = {}) {
  const n = Math.min(Math.max(numQuestions, 1), 10);
  const user = `Create ${n} multiple-choice questions that test understanding of the lesson below.

Respond with JSON of EXACTLY this shape:
{"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"why the correct option is correct"}]}

Rules:
- Exactly 4 options per question.
- "correctIndex" is the 0-based index of the correct option.
- Base every question strictly on the lesson content; keep them clear and unambiguous.
- "explanation" briefly justifies the correct answer.

LESSON TITLE: ${title || '(untitled)'}
LESSON CONTENT:
"""
${String(content).slice(0, 8000)}
"""`;

  const data = await chatJSON({
    system: QUIZ_SYSTEM,
    user,
    validate: validQuiz,
    temperature: 0.5,
  });

  return data.questions.map((q) => ({
    type: 'mcq',
    question: String(q.question).trim(),
    options: q.options.map((o) => String(o)),
    correctIndex: q.correctIndex,
    explanation: q.explanation ? String(q.explanation).trim() : '',
    points: 1,
  }));
}

/* -------------------------------- Auto-grading ------------------------------ */

const GRADE_SYSTEM =
  'You are a fair, encouraging grader. You grade a student\'s open-ended answer ' +
  'against the question and rubric. You ALWAYS respond with strict JSON only.';

/**
 * Grade an open-ended answer.
 * @returns {Promise<{score:number, feedback:string}>}
 */
export async function gradeOpenAnswer({ question, answer, maxPoints = 1, rubric = '' }) {
  const user = `Grade the student's answer to the question.

Respond with JSON: {"score": <number between 0 and ${maxPoints}>, "feedback": "<concise constructive feedback>"}

QUESTION: ${question}
${rubric ? `RUBRIC: ${rubric}\n` : ''}STUDENT ANSWER: ${answer || '(no answer provided)'}

Rules:
- "score" is between 0 and ${maxPoints} (fractional allowed).
- Give brief, constructive, encouraging feedback.`;

  const data = await chatJSON({
    system: GRADE_SYSTEM,
    user,
    validate: (o) => o && typeof o.score === 'number' && o.score >= 0,
    temperature: 0.2,
  });

  return {
    score: Math.max(0, Math.min(maxPoints, data.score)),
    feedback: data.feedback ? String(data.feedback).trim() : '',
  };
}
