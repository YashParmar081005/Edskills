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

/* ------------------------------- RAG Q&A ------------------------------------ */

const ASK_SYSTEM =
  'You are a helpful course teaching assistant. Answer the student STRICTLY using ' +
  'the provided context excerpts from the course. If the answer is not in the ' +
  'context, say you do not have enough information in the course material. ' +
  'You ALWAYS respond with strict JSON only.';

/**
 * Answer a course question grounded in retrieved chunks.
 * @returns {Promise<{answer:string, sources:number[]}>}
 */
export async function answerCourseQuestion({ question, chunks }) {
  const context = chunks
    .map((c, i) => `[${i + 1}] (from lesson "${c.lessonTitle}")\n${c.chunkText}`)
    .join('\n\n');

  const user = `CONTEXT EXCERPTS:\n${context}\n\nSTUDENT QUESTION: ${question}\n\nRespond with JSON: {"answer":"<your answer, grounded in the context>","sources":[<the excerpt numbers you used, e.g. 1,3>]}`;

  const data = await chatJSON({
    system: ASK_SYSTEM,
    user,
    validate: (o) => o && typeof o.answer === 'string',
    temperature: 0.3,
  });

  return {
    answer: data.answer.trim(),
    sources: Array.isArray(data.sources) ? data.sources.map(Number).filter(Boolean) : [],
  };
}

/* ---------------------------- Universal assistant --------------------------- */

const ASSISTANT_SYSTEM = (role) =>
  `You are the friendly AI assistant for "EdSkill.ai", an AI-powered learning platform. ` +
  `The current user's role is ${role}. Help them use the platform — browsing & enrolling in ` +
  `courses, the lesson player and progress tracking, AI-generated quizzes, assignments, course ` +
  `discussion forums, certificates, and (for instructors/admins) the course builder & analytics. ` +
  `Also answer general study/tutoring questions. Be concise, friendly and practical. ` +
  `You ALWAYS respond with strict JSON.`;

/**
 * Conversational assistant. If `courseContext` (numbered excerpts) is provided,
 * the model may ground course-specific answers in it and cite excerpt numbers.
 * @returns {Promise<{reply:string, sources:number[]}>}
 */
export async function assistantChat({ role, messages, courseContext = '', docContext = '' }) {
  const history = messages
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const user =
    (docContext
      ? `ATTACHED DOCUMENT (the user uploaded this — use it to answer their questions):\n"""\n${String(docContext).slice(0, 16000)}\n"""\n\n`
      : '') +
    (courseContext ? `RELEVANT COURSE MATERIAL:\n${courseContext}\n\n` : '') +
    `CONVERSATION:\n${history}\n\n` +
    (courseContext
      ? 'If the user asks about this course\'s content, answer using the material above and put the excerpt numbers you used in "sources". '
      : '') +
    (docContext ? 'If the user asks about the attached document, answer using it. ' : '') +
    'Respond with JSON: {"reply":"<your helpful answer>","sources":[<excerpt numbers used, or empty>]}';

  const data = await chatJSON({
    system: ASSISTANT_SYSTEM(role),
    user,
    validate: (o) => o && typeof o.reply === 'string',
    temperature: 0.5,
  });

  return {
    reply: data.reply.trim(),
    sources: Array.isArray(data.sources) ? data.sources.map(Number).filter(Boolean) : [],
  };
}

/* --------------------------- Document Q&A (study) --------------------------- */

const DOC_QA_SYSTEM =
  'You are a precise study assistant. Answer the user\'s question using ONLY the ' +
  'provided document text. If the answer is not in the document, say so honestly ' +
  'instead of inventing facts. You ALWAYS respond with strict JSON only.';

/**
 * Answer a question grounded strictly in an uploaded document's text.
 * @returns {Promise<{answer:string, found:boolean}>}
 */
export async function answerFromDocument({ documentText, question, history = [] }) {
  const convo = history
    .slice(-4)
    .map((m) => `${m.role === 'user' ? 'Q' : 'A'}: ${m.content}`)
    .join('\n');

  const user = `DOCUMENT:\n"""\n${String(documentText).slice(0, 24000)}\n"""\n\n${
    convo ? `EARLIER IN THIS CHAT:\n${convo}\n\n` : ''
  }QUESTION: ${question}\n\nRespond with JSON: {"answer":"<clear answer grounded in the document>","found": true or false}`;

  const data = await chatJSON({
    system: DOC_QA_SYSTEM,
    user,
    validate: (o) => o && typeof o.answer === 'string',
    temperature: 0.2,
  });

  return { answer: data.answer.trim(), found: data.found !== false };
}

/* ------------------------------- Flashcards --------------------------------- */

const FLASH_SYSTEM =
  'You are an expert tutor who writes concise, accurate study flashcards. ' +
  'You ALWAYS respond with strict JSON only.';

/**
 * Generate study flashcards from a topic (or from supplied material).
 * @returns {Promise<Array<{front:string, back:string}>>}
 */
export async function generateFlashcards({ topic = '', count = 10, context = '' } = {}) {
  const n = Math.min(Math.max(count, 3), 20);
  const user = `Create ${n} study flashcards ${
    context ? 'based on the MATERIAL below' : `about the topic: ${topic}`
  }.
${context ? `MATERIAL:\n"""\n${String(context).slice(0, 12000)}\n"""\n` : ''}
Respond with JSON: {"cards":[{"front":"<question or term>","back":"<concise, correct answer>"}]}
Rules:
- EXACTLY ${n} cards, each distinct.
- "front" is a short prompt/term; "back" is a clear answer (1-3 sentences).`;

  const data = await chatJSON({
    system: FLASH_SYSTEM,
    user,
    validate: (o) =>
      o && Array.isArray(o.cards) && o.cards.length > 0 && o.cards.every((c) => c.front && c.back),
    temperature: 0.6,
  });

  return data.cards
    .map((c) => ({ front: String(c.front).trim(), back: String(c.back).trim() }))
    .slice(0, n);
}

/* ------------------------------- Mock tests --------------------------------- */

const MOCK_SYSTEM =
  'You are an expert exam writer. You write clear, unambiguous multiple-choice ' +
  'questions to test a learner. You ALWAYS respond with strict JSON only.';

/**
 * Generate a topic-based mock test (MCQs with explanations).
 * @returns {Promise<Array<{question,options,correctIndex,explanation}>>}
 */
export async function generateMockTest({ topic = '', numQuestions = 5, difficulty = 'medium', context = '' } = {}) {
  const n = Math.min(Math.max(numQuestions, 1), 15);
  const user = `Create a ${difficulty}-difficulty mock test of ${n} multiple-choice questions ${
    context ? 'based on the MATERIAL below' : `about the topic: ${topic}`
  }.
${context ? `MATERIAL:\n"""\n${String(context).slice(0, 12000)}\n"""\n` : ''}
Respond with JSON of EXACTLY this shape:
{"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"why the correct option is correct"}]}
Rules:
- Exactly 4 options per question.
- "correctIndex" is the 0-based index of the correct option.
- Make questions ${difficulty} difficulty, clear and unambiguous.`;

  const data = await chatJSON({
    system: MOCK_SYSTEM,
    user,
    validate: validQuiz,
    temperature: 0.5,
  });

  return data.questions.map((q) => ({
    question: String(q.question).trim(),
    options: q.options.map((o) => String(o)),
    correctIndex: q.correctIndex,
    explanation: q.explanation ? String(q.explanation).trim() : '',
  }));
}

/* ------------------------------ Avatar seeds -------------------------------- */

const AVATAR_SYSTEM =
  'You invent short, evocative "persona seed" phrases used to deterministically ' +
  'generate cartoon profile-avatar art. You ALWAYS respond with strict JSON only.';

/**
 * Ask the LLM for `count` distinct, imaginative seed phrases for avatar art.
 * Seeds are fed to a deterministic avatar renderer (DiceBear) on the client.
 * @returns {Promise<string[]>}
 */
export async function generateAvatarSeeds({ name = '', prompt = '', count = 8 } = {}) {
  const n = Math.min(Math.max(count, 1), 12);
  const user = `Invent ${n} short, distinct, imaginative "persona seed" phrases for generating profile avatars.
Requested vibe/theme: ${prompt || 'fun, friendly, professional and varied'}
User's name (inspiration only, do not copy verbatim): ${name || '(anonymous)'}

Respond with JSON: {"seeds":["...","..."]}
Rules:
- EXACTLY ${n} seeds.
- Each seed is 1-4 words, vivid and distinct from the others.
- No numbering, no surrounding quotes inside a seed, no emoji.`;

  const data = await chatJSON({
    system: AVATAR_SYSTEM,
    user,
    validate: (o) => o && Array.isArray(o.seeds) && o.seeds.length > 0,
    temperature: 0.9,
  });

  return data.seeds.map((s) => String(s).trim()).filter(Boolean).slice(0, n);
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

/**
 * Grade a student's assignment submission against the instructions/rubric.
 * @returns {Promise<{score:number, feedback:string}>}
 */
export async function gradeAssignment({ title, description, maxScore = 100, submission }) {
  const user = `Grade this student's assignment submission.

Respond with JSON: {"score": <number between 0 and ${maxScore}>, "feedback": "<detailed, constructive feedback>"}

ASSIGNMENT TITLE: ${title}
INSTRUCTIONS / RUBRIC:
${description || '(none provided)'}
MAX SCORE: ${maxScore}

STUDENT SUBMISSION:
"""
${String(submission || '').slice(0, 8000)}
"""

Rules:
- "score" is between 0 and ${maxScore} (fractional allowed).
- Feedback should note specific strengths and concrete areas to improve.`;

  const data = await chatJSON({
    system: GRADE_SYSTEM,
    user,
    validate: (o) => o && typeof o.score === 'number' && o.score >= 0,
    temperature: 0.2,
  });

  return {
    score: Math.max(0, Math.min(maxScore, data.score)),
    feedback: data.feedback ? String(data.feedback).trim() : '',
  };
}
