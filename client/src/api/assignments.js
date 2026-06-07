import api from './axios.js';

/** POST /api/upload/file (any type) → { url, fileName } */
export async function uploadFile(file, onProgress) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/upload/file', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data;
}

/* -------------------------------- Assignments ------------------------------- */

export async function listCourseAssignments(courseId) {
  const { data } = await api.get(`/courses/${courseId}/assignments`);
  return data; // { assignments, isOwner }
}

/** GET /api/assignments/mine → { assignments, courses } (instructor, all courses) */
export async function getMyAssignments() {
  const { data } = await api.get('/assignments/mine');
  return data;
}

export async function createAssignment(courseId, payload) {
  const { data } = await api.post(`/courses/${courseId}/assignments`, payload);
  return data.assignment;
}

export async function updateAssignment(id, payload) {
  const { data } = await api.put(`/assignments/${id}`, payload);
  return data.assignment;
}

export async function deleteAssignment(id) {
  const { data } = await api.delete(`/assignments/${id}`);
  return data;
}

/* -------------------------------- Submissions ------------------------------- */

export async function submitAssignment(id, payload) {
  const { data } = await api.post(`/assignments/${id}/submit`, payload);
  return data.submission;
}

export async function listSubmissions(assignmentId) {
  const { data } = await api.get(`/assignments/${assignmentId}/submissions`);
  return data; // { assignment, submissions }
}

export async function gradeSubmission(id, payload) {
  const { data } = await api.post(`/submissions/${id}/grade`, payload);
  return data.submission;
}

export async function aiSuggestGrade(id) {
  const { data } = await api.post(`/submissions/${id}/ai-suggest`);
  return data; // { aiScore, aiFeedback }
}
