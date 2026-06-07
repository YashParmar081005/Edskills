import api from './axios.js';

/** POST /api/ai/quiz/generate → [questions] (draft, not saved) */
export async function generateQuizAI({ lessonId, numQuestions }) {
  const { data } = await api.post('/ai/quiz/generate', { lessonId, numQuestions });
  return data.questions;
}

/** POST /api/quizzes → saved quiz */
export async function saveQuiz(payload) {
  const { data } = await api.post('/quizzes', payload);
  return data.quiz;
}

/** GET /api/quizzes/lesson/:lessonId → { quiz, attempt? } */
export async function getQuizByLesson(lessonId) {
  const { data } = await api.get(`/quizzes/lesson/${lessonId}`);
  return data;
}

/** DELETE /api/quizzes/:id */
export async function deleteQuiz(id) {
  const { data } = await api.delete(`/quizzes/${id}`);
  return data;
}

/** POST /api/quizzes/:id/attempt → { results, score, maxScore, percentage } */
export async function attemptQuiz(id, answers) {
  const { data } = await api.post(`/quizzes/${id}/attempt`, { answers });
  return data;
}

/** GET /api/quizzes/:id/my-attempt → attempt|null */
export async function getMyAttempt(id) {
  const { data } = await api.get(`/quizzes/${id}/my-attempt`);
  return data.attempt;
}

/** GET /api/quizzes/mine → quizzes across enrolled courses + last score */
export async function getMyQuizzes() {
  const { data } = await api.get('/quizzes/mine');
  return data.quizzes;
}

/** GET /api/quizzes/instructor → quizzes across the instructor's courses */
export async function getInstructorQuizzes() {
  const { data } = await api.get('/quizzes/instructor');
  return data.quizzes;
}
