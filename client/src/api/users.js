import api from './axios.js';

export const listUsers = async (params) => (await api.get('/users', { params })).data;
export const updateUserRole = async (id, role) =>
  (await api.patch(`/users/${id}/role`, { role })).data;
export const deleteUser = async (id) => (await api.delete(`/users/${id}`)).data;
export const broadcast = async (message) =>
  (await api.post('/notifications/broadcast', { message })).data;
