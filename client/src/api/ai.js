import api from './axios.js';

/** POST /api/ai/ask → { answer, citations } */
export async function askCourse(courseId, question) {
  const { data } = await api.post('/ai/ask', { courseId, question });
  return data;
}

/** POST /api/ai/chat → { reply, citations } (universal assistant) */
export async function chatAssistant(messages, courseId) {
  const { data } = await api.post('/ai/chat', { messages, courseId });
  return data;
}

/** POST /api/ai/avatar → { avatars: [{url, style, seed}], aiUsed } */
export async function generateAvatars(prompt) {
  const { data } = await api.post('/ai/avatar', { prompt });
  return data;
}
