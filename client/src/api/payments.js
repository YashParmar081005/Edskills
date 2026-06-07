import api from './axios.js';

/** POST /api/payments/checkout → { url, sessionId } */
export async function createCheckout(courseId) {
  const { data } = await api.post('/payments/checkout', { courseId });
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
