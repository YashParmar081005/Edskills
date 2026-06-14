import api from './axios.js';

/** GET /coupons → { coupons } (instructor's coupons) */
export async function listMyCoupons() {
  const { data } = await api.get('/coupons');
  return data.coupons;
}

/** POST /coupons → { coupon } */
export async function createCoupon(payload) {
  const { data } = await api.post('/coupons', payload);
  return data.coupon;
}

/** DELETE /coupons/:id */
export async function deleteCoupon(id) {
  const { data } = await api.delete(`/coupons/${id}`);
  return data;
}

/** POST /coupons/validate → { valid, percentOff, originalPrice, discountedPrice, code } */
export async function validateCoupon(code, courseId) {
  const { data } = await api.post('/coupons/validate', { code, courseId });
  return data;
}
