import api from './axios.js';

export const getInstructorAnalytics = async () =>
  (await api.get('/analytics/instructor')).data;

export const getAdminAnalytics = async () => (await api.get('/analytics/admin')).data;

export const getStudentAnalytics = async () => (await api.get('/analytics/student')).data;

export const getAiUsage = async () => (await api.get('/analytics/ai-usage')).data;

export const sendReminders = async () => (await api.post('/analytics/send-reminders')).data;
