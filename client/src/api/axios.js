import axios from 'axios';

/**
 * Shared axios instance.
 *
 * baseURL: VITE_API_URL if set, else "/api" (proxied to the backend in dev).
 * withCredentials: sends the httpOnly refresh-token cookie.
 *
 * Access token strategy:
 *  - The short-lived access token lives in memory only (not localStorage),
 *    set via setAccessToken() after login/register/refresh.
 *  - A request interceptor attaches it as a Bearer header.
 *  - A response interceptor transparently refreshes it once on a 401, then
 *    retries the original request. Concurrent 401s share one refresh call.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token || null;
};
export const getAccessToken = () => accessToken;

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Endpoints whose 401s must NOT trigger a refresh attempt.
const NO_REFRESH = ['/auth/refresh', '/auth/login', '/auth/register'];

let refreshPromise = null;

async function refreshAccessToken() {
  // Bare axios call (no interceptors) to avoid recursion.
  const { data } = await axios.post(
    `${api.defaults.baseURL}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  setAccessToken(data.accessToken);
  return data.accessToken;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || '';

    const isRefreshable =
      status === 401 &&
      original &&
      !original._retried &&
      !NO_REFRESH.some((p) => url.includes(p));

    if (isRefreshable) {
      original._retried = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        refreshPromise = null;
        setAccessToken(null);
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
