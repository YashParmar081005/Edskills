import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * JWT helpers. Access tokens are short-lived and sent in the Authorization
 * header; refresh tokens are long-lived and stored in an httpOnly cookie.
 */

export function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role },
    env.jwtSecret,
    { expiresIn: env.accessTokenExpires }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role },
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTokenExpires }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

/** Name of the httpOnly cookie that holds the refresh token. */
export const REFRESH_COOKIE = 'refreshToken';

/**
 * Cookie options for the refresh token. In dev the client talks to the API
 * through the Vite proxy (same-origin), so sameSite='lax' works. In production
 * with split domains, set NODE_ENV=production for secure + sameSite='none'.
 */
export function refreshCookieOptions() {
  const isProd = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}
