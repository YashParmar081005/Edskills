import api from './axios.js';

/** POST /api/payments/checkout → { url, sessionId } or { free, courseId } */
export async function createCheckout(courseId, couponCode) {
  const { data } = await api.post('/payments/checkout', { courseId, couponCode });
  return data;
}

/** POST /api/payments/confirm → { paid, courseId } */
export async function confirmPayment(sessionId) {
  const { data } = await api.post('/payments/confirm', { sessionId });
  return data;
}

/** GET /api/payments (admin) → { payments, revenue } */
export async function listPayments() {
  const { data } = await api.get('/payments');
  return data;
}

/** GET /api/payments/earnings (instructor) → { totals, perCourse, recent, share } */
export async function getEarnings() {
  const { data } = await api.get('/payments/earnings');
  return data;
}
