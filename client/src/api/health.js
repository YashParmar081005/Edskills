import api from './axios.js';

/**
 * GET /api/health — returns the backend health payload.
 * Shape: { status, service, timestamp, uptime, db }
 */
export async function getHealth() {
  const { data } = await api.get('/health');
  return data;
}
