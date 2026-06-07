import api from './axios.js';

export async function listThreads(courseId) {
  const { data } = await api.get(`/courses/${courseId}/threads`);
  return data; // { threads, courseTitle }
}

export async function createThread(courseId, payload) {
  const { data } = await api.post(`/courses/${courseId}/threads`, payload);
  return data.thread;
}

export async function getThread(threadId) {
  const { data } = await api.get(`/threads/${threadId}`);
  return data; // { thread, replies, canModerate, isThreadAuthor }
}

/** GET /api/threads/mine → threads across the instructor's courses */
export async function getMyThreads() {
  const { data } = await api.get('/threads/mine');
  return data.threads;
}

export async function deleteThread(threadId) {
  const { data } = await api.delete(`/threads/${threadId}`);
  return data;
}

export async function createReply(threadId, body) {
  const { data } = await api.post(`/threads/${threadId}/replies`, { body });
  return data.reply;
}

export async function deleteReply(replyId) {
  const { data } = await api.delete(`/replies/${replyId}`);
  return data;
}

export async function upvoteThread(threadId) {
  const { data } = await api.post(`/threads/${threadId}/upvote`);
  return data;
}

export async function upvoteReply(replyId) {
  const { data } = await api.post(`/replies/${replyId}/upvote`);
  return data;
}

export async function markAnswer(replyId) {
  const { data } = await api.post(`/replies/${replyId}/answer`);
  return data;
}
