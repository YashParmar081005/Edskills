import api from './axios.js';

/** GET /gamification/me → { xp, level, xpIntoLevel, streak, badges, rank, catalog } */
export async function getMyGamification() {
  const { data } = await api.get('/gamification/me');
  return data;
}

/** GET /gamification/leaderboard → { leaders, me } */
export async function getLeaderboard() {
  const { data } = await api.get('/gamification/leaderboard');
  return data;
}
