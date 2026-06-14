import api from './axios.js';

/* --------------------------------- Notes ---------------------------------- */

/** GET /notes → all my notes */
export async function getMyNotes() {
  const { data } = await api.get('/notes');
  return data.notes;
}

/** GET /notes/course/:courseId → { notes: {lessonId: content}, bookmarkLessonIds } */
export async function getCourseStudyState(courseId) {
  const { data } = await api.get(`/notes/course/${courseId}`);
  return data;
}

/** PUT /notes/lesson/:lessonId → upsert note */
export async function saveLessonNote(lessonId, content) {
  const { data } = await api.put(`/notes/lesson/${lessonId}`, { content });
  return data.note;
}

/* ------------------------------- Bookmarks -------------------------------- */

/** GET /bookmarks → my bookmarked lessons */
export async function getMyBookmarks() {
  const { data } = await api.get('/bookmarks');
  return data.bookmarks;
}

/** POST /bookmarks/lesson/:lessonId → { bookmarked } */
export async function toggleBookmark(lessonId) {
  const { data } = await api.post(`/bookmarks/lesson/${lessonId}`);
  return data;
}
