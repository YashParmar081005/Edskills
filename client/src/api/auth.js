import api from './axios.js';

/** POST /auth/register → { accessToken, user } */
export async function registerRequest(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

/** POST /auth/login → { accessToken, user } */
export async function loginRequest(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

/** POST /auth/refresh → { accessToken, user } (uses httpOnly cookie) */
export async function refreshRequest() {
  const { data } = await api.post('/auth/refresh');
  return data;
}

/** POST /auth/logout */
export async function logoutRequest() {
  const { data } = await api.post('/auth/logout');
  return data;
}

/** GET /auth/me → { user } */
export async function meRequest() {
  const { data } = await api.get('/auth/me');
  return data;
}
