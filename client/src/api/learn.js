import api from './axios.js';

/** POST /api/courses/:id/enroll */
export async function enrollCourse(courseId) {
  const { data } = await api.post(`/courses/${courseId}/enroll`);
  return data;
}

/** GET /api/enrollments/me → [{ course, progressPercent, status, ... }] */
export async function getMyEnrollments() {
  const { data } = await api.get('/enrollments/me');
  return data.enrollments;
}

/** GET /api/courses/:id/learn → { course (full + per-lesson progress), progress } */
export async function getCourseLearn(courseId) {
  const { data } = await api.get(`/courses/${courseId}/learn`);
  return data;
}

/** POST /api/progress  body: { lessonId, completed?, watchedSeconds? } */
export async function saveProgress(payload) {
  const { data } = await api.post('/progress', payload);
  return data; // { progress, percent, totalLessons, completedLessons }
}

/** GET /api/courses/:id/progress */
export async function getCourseProgress(courseId) {
  const { data } = await api.get(`/courses/${courseId}/progress`);
  return data;
}
