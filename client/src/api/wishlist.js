import api from './axios.js';

/** GET /wishlist → { courses, courseIds } */
export async function getWishlist() {
  const { data } = await api.get('/wishlist');
  return data;
}

/** GET /wishlist/ids → string[] of saved course ids */
export async function getWishlistIds() {
  const { data } = await api.get('/wishlist/ids');
  return data.courseIds;
}

/** POST /wishlist/:courseId → { wishlisted } */
export async function toggleWishlist(courseId) {
  const { data } = await api.post(`/wishlist/${courseId}`);
  return data;
}
