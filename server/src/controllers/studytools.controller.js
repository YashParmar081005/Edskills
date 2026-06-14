import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { extractTextFromFile } from '../services/docExtract.js';
import {
  answerFromDocument,
  generateFlashcards,
  generateMockTest,
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
 * POST /api/ai/doc/extract   (multipart field: "file")
 * Pull plain text out of a PDF/DOCX/TXT so it can be queried. No LLM call.
 */
export const extractDoc = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded.');
  const text = await extractTextFromFile(req.file);
  res.json({ success: true, name: req.file.originalname, chars: text.length, text });
});

/**
 * POST /api/ai/doc/ask
 * Body: { text, question, history? } → answer grounded in the document text.
 */
export const askDoc = asyncHandler(async (req, res) => {
  assertAI();
  const { text, question, history } = req.body;
  if (!text || String(text).trim().length < 20) {
    throw new ApiError(400, 'Upload and load a document first.');
  }
  if (!question || !String(question).trim()) throw new ApiError(400, 'A question is required.');

  try {
    const result = await answerFromDocument({
      documentText: String(text),
      question: String(question),
      history: Array.isArray(history) ? history : [],
      meta: { user: req.user._id, type: 'doc-qa' },
    });
    res.json({ success: true, ...result });
  } catch (err) {
    throw new ApiError(502, `Answering failed: ${err.message}`);
  }
});

/**
 * POST /api/ai/flashcards
 * Body: { topic?, count?, context? } → [{front, back}]
 */
export const flashcards = asyncHandler(async (req, res) => {
  assertAI();
  const { topic, count, context } = req.body;
  if (!String(topic || '').trim() && !String(context || '').trim()) {
    throw new ApiError(400, 'Provide a topic.');
  }
  try {
    const cards = await generateFlashcards({
      topic: String(topic || '').trim(),
      count: Number(count) || 10,
      context: String(context || ''),
      meta: { user: req.user._id, type: 'flashcards' },
    });
    res.json({ success: true, cards });
  } catch (err) {
    throw new ApiError(502, `Flashcard generation failed: ${err.message}`);
  }
});

/**
 * POST /api/ai/mock-test
 * Body: { topic?, numQuestions?, difficulty?, context? } → [{question, options, ...}]
 */
export const mockTest = asyncHandler(async (req, res) => {
  assertAI();
  const { topic, numQuestions, difficulty, context } = req.body;
  if (!String(topic || '').trim() && !String(context || '').trim()) {
    throw new ApiError(400, 'Provide a topic.');
  }
  try {
    const questions = await generateMockTest({
      topic: String(topic || '').trim(),
      numQuestions: Number(numQuestions) || 5,
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
      context: String(context || ''),
      meta: { user: req.user._id, type: 'mock-test' },
    });
    res.json({ success: true, questions });
  } catch (err) {
    throw new ApiError(502, `Mock test generation failed: ${err.message}`);
  }
});
