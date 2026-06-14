import api from './axios.js';

/** GET /courses/:id/reviews → { reviews, mine, ratingAvg, ratingCount } */
export async function getReviews(courseId) {
  const { data } = await api.get(`/courses/${courseId}/reviews`);
  return data;
}

/** POST /courses/:id/reviews → { review } */
export async function submitReview(courseId, payload) {
  const { data } = await api.post(`/courses/${courseId}/reviews`, payload);
  return data.review;
}

/** DELETE /reviews/:id */
export async function deleteReview(id) {
  const { data } = await api.delete(`/reviews/${id}`);
  return data;
}
