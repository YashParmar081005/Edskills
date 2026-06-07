import api from './axios.js';

/** POST /api/ai/ask → { answer, citations } */
export async function askCourse(courseId, question) {
  const { data } = await api.post('/ai/ask', { courseId, question });
  return data;
}

/** POST /api/ai/chat → { reply, citations } (universal assistant) */
export async function chatAssistant(messages, courseId, docText) {
  const { data } = await api.post('/ai/chat', { messages, courseId, docText });
  return data;
}

/** POST /api/ai/avatar → { avatars: [{url, style, seed}], aiUsed } */
export async function generateAvatars(prompt) {
  const { data } = await api.post('/ai/avatar', { prompt });
  return data;
}

/* ------------------------------- Study tools ------------------------------- */

/** POST /api/ai/doc/extract (multipart "file") → { name, chars, text } */
export async function extractDoc(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/ai/doc/extract', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** POST /api/ai/doc/ask → { answer, found } */
export async function askDoc(payload) {
  const { data } = await api.post('/ai/doc/ask', payload);
  return data;
}

/** POST /api/ai/flashcards → { cards: [{front, back}] } */
export async function generateFlashcards(payload) {
  const { data } = await api.post('/ai/flashcards', payload);
  return data;
}

/** POST /api/ai/mock-test → { questions: [{question, options, correctIndex, explanation}] } */
export async function generateMockTest(payload) {
  const { data } = await api.post('/ai/mock-test', payload);
  return data;
}
