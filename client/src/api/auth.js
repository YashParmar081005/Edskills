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

/** POST /auth/oauth/insforge → { accessToken, user } (exchange InsForge token for an app session) */
export async function oauthInsforgeRequest(accessToken) {
  const { data } = await api.post('/auth/oauth/insforge', { accessToken });
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

/** PATCH /auth/me → { user } — update name/email/avatar */
export async function updateProfileRequest(payload) {
  const { data } = await api.patch('/auth/me', payload);
  return data;
}

/** POST /auth/me/password → { accessToken, user } */
export async function changePasswordRequest(payload) {
  const { data } = await api.post('/auth/me/password', payload);
  return data;
}

/** PATCH /auth/me/settings → { user } — notification preferences */
export async function updateSettingsRequest(payload) {
  const { data } = await api.patch('/auth/me/settings', payload);
  return data;
}

/** POST /upload/avatar (multipart "image") → { url } */
export async function uploadAvatarRequest(file) {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post('/upload/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data; // { url, publicId }
}
