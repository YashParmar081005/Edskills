import api from './axios.js';

/* ------------------------------ Public / student ---------------------------- */

export async function browseCourses(params = {}) {
  const { data } = await api.get('/courses', { params });
  return data.courses;
}

export async function getPublicCourse(id) {
  const { data } = await api.get(`/courses/${id}`);
  return data.course; // includes isOwner, isEnrolled, outline modules
}

/* ---------------------------------- Courses --------------------------------- */

export async function getMyCourses() {
  const { data } = await api.get('/courses/mine');
  return data.courses;
}

export async function getCourse(id) {
  const { data } = await api.get(`/courses/${id}`);
  return data.course;
}

export async function createCourse(payload) {
  const { data } = await api.post('/courses', payload);
  return data.course;
}

export async function updateCourse(id, payload) {
  const { data } = await api.put(`/courses/${id}`, payload);
  return data.course;
}

export async function deleteCourse(id) {
  const { data } = await api.delete(`/courses/${id}`);
  return data;
}

export async function togglePublish(id, isPublished) {
  const { data } = await api.post(`/courses/${id}/publish`, { isPublished });
  return data;
}

/* ---------------------------------- Modules --------------------------------- */

export async function addModule(courseId, title) {
  const { data } = await api.post(`/courses/${courseId}/modules`, { title });
  return data.module;
}

export async function updateModule(moduleId, title) {
  const { data } = await api.put(`/modules/${moduleId}`, { title });
  return data.module;
}

export async function deleteModule(moduleId) {
  const { data } = await api.delete(`/modules/${moduleId}`);
  return data;
}

export async function reorderModules(courseId, orderedIds) {
  const { data } = await api.put(`/courses/${courseId}/modules/reorder`, { orderedIds });
  return data;
}

/* ---------------------------------- Lessons --------------------------------- */

export async function addLesson(moduleId, payload) {
  const { data } = await api.post(`/modules/${moduleId}/lessons`, payload);
  return data.lesson;
}

export async function updateLesson(lessonId, payload) {
  const { data } = await api.put(`/lessons/${lessonId}`, payload);
  return data.lesson;
}

export async function deleteLesson(lessonId) {
  const { data } = await api.delete(`/lessons/${lessonId}`);
  return data;
}

export async function reorderLessons(moduleId, orderedIds) {
  const { data } = await api.put(`/modules/${moduleId}/lessons/reorder`, { orderedIds });
  return data;
}

/* ---------------------------------- Uploads --------------------------------- */

export async function uploadVideo(file, onProgress) {
  const form = new FormData();
  form.append('video', file);
  const { data } = await api.post('/upload/video', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data; // { url, duration, publicId }
}

export async function uploadThumbnail(file) {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post('/upload/thumbnail', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data; // { url, publicId }
}
