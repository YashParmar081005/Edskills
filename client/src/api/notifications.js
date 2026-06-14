import api from './axios.js';

export async function getNotifications() {
  const { data } = await api.get('/notifications');
  return data; // { notifications, unreadCount }
}

/** Full history (up to 100) for the notifications center page. */
export async function getAllNotifications() {
  const { data } = await api.get('/notifications', { params: { all: 1 } });
  return data;
}

export async function markNotificationRead(id) {
  const { data } = await api.post(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post('/notifications/read-all');
  return data;
}
